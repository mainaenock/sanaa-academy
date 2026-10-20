import { z } from 'zod';
import { digest } from './crypto';
import { statement, type AppEnv } from './db';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assert(value: unknown, status: number, message: string): asserts value {
  if (!value) throw new HttpError(status, message);
}
export async function jsonBody(request: Request) {
  assert(
    request.headers.get('content-type')?.includes('application/json'),
    415,
    'Use application/json',
  );
  const reader = request.body?.getReader();
  assert(reader, 400, 'A request body is required');
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    length += chunk.value.length;
    if (length > 65536) {
      await reader.cancel();
      throw new HttpError(413, 'Request too large');
    }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}
export function sameOrigin(request: Request, e: AppEnv) {
  assert(
    request.headers.get('origin') === new URL(e.APP_URL).origin,
    403,
    'Request origin is not allowed',
  );
  assert(
    request.headers.get('sec-fetch-site') !== 'cross-site',
    403,
    'Cross-site request rejected',
  );
}
export async function rateLimit(e: AppEnv, key: string, limit: number, windowSeconds = 900) {
  const now = Math.floor(Date.now() / 1000),
    hash = await digest(key);
  const row = await statement(
    e,
    `INSERT INTO rate_limits(key,hits,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN reset_at<=? THEN 1 ELSE hits+1 END,reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END RETURNING hits`,
    hash,
    now + windowSeconds,
    now,
    now,
    now + windowSeconds,
  ).first<{ hits: number }>();
  assert(row && row.hits <= limit, 429, 'Too many attempts. Please try again later.');
}
export async function botCheck(request: Request, e: AppEnv, token: unknown, action: string) {
  assert(e.TURNSTILE_SECRET_KEY, 503, 'Bot protection is awaiting configuration.');
  assert(
    typeof token === 'string' && token.length > 0 && token.length < 2049,
    400,
    'Please complete the security check.',
  );
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: e.TURNSTILE_SECRET_KEY,
      response: token,
      ...(request.headers.get('cf-connecting-ip')
        ? { remoteip: request.headers.get('cf-connecting-ip')! }
        : {}),
    }),
    signal: AbortSignal.timeout(10000),
  });
  assert(response.ok, 503, 'Security check unavailable. Try again.');
  const result = z
    .object({
      success: z.boolean(),
      action: z.string().optional(),
      hostname: z.string().optional(),
    })
    .parse(await response.json());
  const hosts = e.TURNSTILE_HOSTNAMES.split(',').map((s) => s.trim());
  assert(
    e.APP_ENV !== 'production' || !hosts.some((h) => h === 'localhost' || h === '127.0.0.1'),
    503,
    'Production security hostname configuration required.',
  );
  assert(
    result.success &&
      result.action === action &&
      !!result.hostname &&
      hosts.includes(result.hostname),
    403,
    'Security check failed. Please try again.',
  );
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof z.ZodError)
    return Response.json({ error: error.issues.map((i) => i.message).join(' ') }, { status: 400 });
  console.error(
    JSON.stringify({
      event: 'request_failed',
      type: error instanceof Error ? error.name : 'unknown',
    }),
  );
  return Response.json(
    { error: 'Something went wrong. Please try again or contact the academy.' },
    { status: 500 },
  );
}
