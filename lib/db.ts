import { env } from 'cloudflare:workers';
import { defaultCourse, defaultSite, type SiteContent } from './defaults';
import type { Course } from './domain';
type RuntimeVariable = 'APP_URL' | 'APP_ENV' | 'PAYSTACK_MODE' | 'TURNSTILE_HOSTNAMES';
export type AppEnv = Omit<Cloudflare.Env, RuntimeVariable> & Record<RuntimeVariable, string>;
export function runtime(): AppEnv {
  return env;
}
export function statement(e: AppEnv, sql: string, ...args: unknown[]) {
  return e.DB.prepare(sql).bind(...args);
}
export async function all<T>(e: AppEnv, sql: string, ...args: unknown[]) {
  return (await statement(e, sql, ...args).all<T>()).results;
}
export async function first<T>(e: AppEnv, sql: string, ...args: unknown[]) {
  return statement(e, sql, ...args).first<T>();
}
export async function course(e: AppEnv) {
  const c = await first<Course>(e, 'SELECT * FROM courses WHERE id=?', defaultCourse.id);
  if (!c) throw new Error('Database migrations are required');
  return c;
}
export async function site(e: AppEnv): Promise<SiteContent> {
  const row = await first<{ value: string }>(
    e,
    "SELECT value FROM site_settings WHERE key='website'",
  );
  return row ? { ...defaultSite, ...JSON.parse(row.value) } : defaultSite;
}
export function providersReady(e: AppEnv) {
  return !!(
    e.PAYSTACK_SECRET_KEY &&
    e.RESEND_API_KEY &&
    e.EMAIL_FROM &&
    e.TURNSTILE_SITE_KEY &&
    e.TURNSTILE_SECRET_KEY &&
    e.APP_URL
  );
}
