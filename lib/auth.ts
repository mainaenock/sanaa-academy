import { z } from 'zod';
import { all, first, statement, type AppEnv } from './db';
import { digest, randomToken } from './crypto';
import { emailSchema } from './domain';
import { assert, botCheck, rateLimit } from './http';
import { deliverEmail, emailTemplate, queueEmail } from './email';
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'student';
  age_category: 'adult' | 'minor' | null;
  experience: string;
  project_interest: string;
  updates_opt_in: number;
  verified_at: string | null;
  deletion_requested_at: string | null;
  created_at: string;
}
export interface Session {
  user: User;
  csrf: string;
  hash: string;
}
export function cookieName(e: AppEnv) {
  return e.APP_ENV === 'production' ? '__Host-sanaa_session' : 'sanaa_session';
}
export function sessionCookie(e: AppEnv, token: string, maxAge: number) {
  return `${cookieName(e)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${e.APP_ENV === 'production' ? '; Secure' : ''}`;
}
export async function sessionFromCookie(e: AppEnv, cookie: string | null): Promise<Session | null> {
  const value = cookie
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith(cookieName(e) + '='))
    ?.slice(cookieName(e).length + 1);
  if (!value || !/^[a-f0-9]{64}$/.test(value)) return null;
  const hash = await digest(value);
  const row = await first<User & { csrf_token: string }>(
    e,
    'SELECT u.*,s.csrf_token FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',
    hash,
    Math.floor(Date.now() / 1000),
  );
  return row ? { user: row, csrf: row.csrf_token, hash } : null;
}
export async function requireSession(request: Request, e: AppEnv, admin = false) {
  const s = await sessionFromCookie(e, request.headers.get('cookie'));
  assert(s, 401, 'Please sign in to continue.');
  assert(!admin || s.user.role === 'admin', 403, 'Administrator access required.');
  if (!['GET', 'HEAD'].includes(request.method))
    assert(
      request.headers.get('x-csrf-token') === s.csrf,
      403,
      'Your form has expired. Refresh and try again.',
    );
  return s;
}
export async function requireEnrollment(e: AppEnv, userId: string) {
  const enrollment = await first<{ id: string; course_id: string }>(
    e,
    "SELECT id,course_id FROM enrollments WHERE user_id=? AND status='active'",
    userId,
  );
  assert(enrollment, 403, 'A verified active enrollment is required.');
  return enrollment;
}
export async function requestCode(request: Request, e: AppEnv, input: unknown) {
  const data = z.object({ email: emailSchema, turnstileToken: z.string() }).parse(input);
  await rateLimit(e, 'auth-ip:' + request.headers.get('cf-connecting-ip'), 12);
  await rateLimit(e, 'auth-email:' + data.email, 4);
  await botCheck(request, e, data.turnstileToken, 'login');
  assert(e.RESEND_API_KEY && e.EMAIL_FROM, 503, 'Email sign-in is awaiting configuration.');
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 100000000).padStart(8, '0');
  const hash = await digest(data.email + ':' + code),
    id = crypto.randomUUID(),
    now = Math.floor(Date.now() / 1000);
  await e.DB.batch([
    statement(
      e,
      "UPDATE auth_tokens SET consumed_at=? WHERE email=? AND purpose='login' AND consumed_at IS NULL",
      now,
      data.email,
    ),
    statement(
      e,
      "INSERT INTO auth_tokens(token_hash,email,purpose,expires_at) VALUES(?,?,'login',?)",
      hash,
      data.email,
      now + 600,
    ),
  ]);
  await queueEmail(e, {
    id,
    key: id,
    to: data.email,
    subject: 'Your Sanaa Academy sign-in code',
    kind: 'login',
    html: emailTemplate(
      'Your next chapter is waiting',
      `<p>Your one-time sign-in code is:</p><p style="font-size:32px;letter-spacing:7px;font-weight:bold">${code}</p><p>This code expires in 10 minutes and works once. Do not share it. If you did not request it, you can ignore this email.</p>`,
    ),
  });
  const sent = await deliverEmail(e, id);
  assert(sent, 503, 'We could not deliver your code. Please try again later.');
  return Response.json({ message: 'Check your email for an eight-digit code.' });
}
export async function verifyCode(request: Request, e: AppEnv, input: unknown) {
  const data = z.object({ email: emailSchema, code: z.string().regex(/^\d{8}$/) }).parse(input);
  await rateLimit(e, 'verify-ip:' + request.headers.get('cf-connecting-ip'), 20);
  await rateLimit(e, 'verify-email:' + data.email, 8);
  const hash = await digest(data.email + ':' + data.code),
    now = Math.floor(Date.now() / 1000);
  const consumed = await statement(
    e,
    "UPDATE auth_tokens SET consumed_at=? WHERE token_hash=? AND purpose='login' AND expires_at>? AND consumed_at IS NULL RETURNING email",
    now,
    hash,
    now,
  ).first<{ email: string }>();
  assert(consumed, 400, 'This code is invalid, expired, or already used.');
  await statement(
    e,
    'INSERT INTO users(id,email,verified_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(email) DO UPDATE SET verified_at=COALESCE(verified_at,CURRENT_TIMESTAMP)',
    crypto.randomUUID(),
    data.email,
  ).run();
  const user = await first<User>(e, 'SELECT * FROM users WHERE email=?', data.email);
  assert(user, 500, 'Unable to create account');
  const token = randomToken(),
    csrf = randomToken(),
    maxAge = user.role === 'admin' ? 43200 : 604800;
  await statement(
    e,
    'INSERT INTO auth_sessions(token_hash,user_id,csrf_token,expires_at) VALUES(?,?,?,?)',
    await digest(token),
    user.id,
    csrf,
    now + maxAge,
  ).run();
  // Do not retain expired credentials or emailed codes indefinitely.
  await e.DB.batch([
    statement(e, 'DELETE FROM auth_tokens WHERE expires_at<?', now - 86400),
    statement(e, 'DELETE FROM auth_sessions WHERE expires_at<?', now),
    statement(e, 'DELETE FROM rate_limits WHERE reset_at<?', now),
    statement(
      e,
      "DELETE FROM email_outbox WHERE kind='login' AND created_at<datetime('now','-1 day')",
    ),
  ]);
  return Response.json(
    { user: { id: user.id, email: user.email, role: user.role } },
    { headers: { 'Set-Cookie': sessionCookie(e, token, maxAge) } },
  );
}
export async function logout(request: Request, e: AppEnv) {
  const s = await requireSession(request, e);
  await statement(e, 'DELETE FROM auth_sessions WHERE token_hash=?', s.hash).run();
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie(e, '', 0) } });
}
export async function userExport(e: AppEnv, userId: string) {
  const result: Record<string, unknown> = {};
  for (const table of [
    'users',
    'guardians',
    'enrollments',
    'lesson_progress',
    'submissions',
    'privacy_requests',
  ])
    result[table] = await all(
      e,
      `SELECT * FROM ${table} WHERE ${table === 'users' ? 'id' : 'user_id'}=?`,
      userId,
    );
  result.transactions = await all(
    e,
    'SELECT t.reference,t.amount,t.currency,t.status,t.paid_at FROM transactions t JOIN enrollments en ON en.id=t.enrollment_id WHERE en.user_id=?',
    userId,
  );
  return result;
}
