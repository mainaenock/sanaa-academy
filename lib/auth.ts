import { z } from 'zod';
import { all, first, statement, type AppEnv } from './db';
import { digest, randomToken } from './crypto';
import { emailSchema } from './domain';
import { assert, botCheck, rateLimit } from './http';
const passwordSchema = z.string().min(10).max(128);
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
export async function passwordHash(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210_000 },
    key,
    256,
  );
  return `pbkdf2$210000$${Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('')}$${Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('')}`;
}
export async function passwordMatches(password: string, encoded: string) {
  const [algorithm, rounds, saltHex, expectedHex] = encoded.split('$');
  if (
    algorithm !== 'pbkdf2' ||
    rounds !== '210000' ||
    !/^[a-f0-9]{32}$/.test(saltHex ?? '') ||
    !/^[a-f0-9]{64}$/.test(expectedHex ?? '')
  )
    return false;
  const actual = await passwordHash(
    password,
    new Uint8Array(saltHex.match(/../g)!.map((b) => parseInt(b, 16))),
  );
  const expected = new TextEncoder().encode(expectedHex),
    got = new TextEncoder().encode(actual.split('$')[3]);
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ got[i];
  return diff === 0;
}
async function createSession(e: AppEnv, user: User, now = Math.floor(Date.now() / 1000)) {
  const token = randomToken(),
    csrf = randomToken(),
    maxAge = user.role === 'admin' ? 43200 : 2592000;
  await statement(
    e,
    'INSERT INTO auth_sessions(token_hash,user_id,csrf_token,expires_at) VALUES(?,?,?,?)',
    await digest(token),
    user.id,
    csrf,
    now + maxAge,
  ).run();
  return Response.json(
    { user: { id: user.id, email: user.email, role: user.role }, csrf },
    { headers: { 'Set-Cookie': sessionCookie(e, token, maxAge) } },
  );
}
export async function registerAccount(request: Request, e: AppEnv, input: unknown) {
  const data = z.object({ email: emailSchema, password: passwordSchema }).parse(input);
  await rateLimit(e, 'register-ip:' + request.headers.get('cf-connecting-ip'), 8);
  await rateLimit(e, 'register-email:' + data.email, 4);
  assert(
    !(await first(e, 'SELECT id FROM users WHERE email=?', data.email)),
    409,
    'An account already exists for this email. Sign in to continue.',
  );
  const hash = await passwordHash(data.password),
    id = crypto.randomUUID();
  await statement(
    e,
    'INSERT INTO users(id,email,password_hash) VALUES(?,?,?)',
    id,
    data.email,
    hash,
  ).run();
  const user = await first<User>(e, 'SELECT * FROM users WHERE id=?', id);
  assert(user, 500, 'Unable to create account');
  return createSession(e, user);
}
export async function loginPassword(request: Request, e: AppEnv, input: unknown) {
  const data = z
    .object({ email: emailSchema, password: passwordSchema, turnstileToken: z.string() })
    .parse(input);
  await rateLimit(e, 'password-login-ip:' + request.headers.get('cf-connecting-ip'), 12);
  await rateLimit(e, 'password-login-email:' + data.email, 8);
  await botCheck(request, e, data.turnstileToken, 'login');
  const user = await first<User & { password_hash: string | null }>(
    e,
    'SELECT * FROM users WHERE email=?',
    data.email,
  );
  assert(
    user?.password_hash && (await passwordMatches(data.password, user.password_hash)),
    401,
    'Email or password is incorrect.',
  );
  return createSession(e, user);
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
