import { z } from 'zod';

export const COURSE_ID = 'ai-web-2026';
export const POLICY_VERSION = '2026-10-17';
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const safeUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  }, 'Use a secure https:// URL without embedded credentials');
export const registrationSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    learnerEmail: emailSchema,
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{9,22}$/, 'Enter a valid phone number'),
    ageCategory: z.enum(['adult', 'minor']),
    experience: z.string().trim().max(500).default(''),
    projectInterest: z.string().trim().max(2000).default(''),
    guardianName: z.string().trim().max(120).default(''),
    guardianEmail: z.union([emailSchema, z.literal('')]).default(''),
    guardianPhone: z.string().trim().max(22).default(''),
    guardianConsent: z.boolean().default(false),
    terms: z.literal(true),
    updatesOptIn: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (
      v.ageCategory === 'minor' &&
      (!v.guardianConsent ||
        v.guardianName.length < 2 ||
        !v.guardianEmail ||
        !/^\+?[0-9 ()-]{9,22}$/.test(v.guardianPhone))
    )
      ctx.addIssue({
        code: 'custom',
        path: ['guardianConsent'],
        message: 'A verified parent or guardian must provide their name, email, phone and consent.',
      });
  });
export interface Course {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  timezone: string;
  regular_price: number;
  early_price: number;
  early_deadline: string;
  registration_open: number;
  opens_at: string | null;
  closes_at: string | null;
  capacity: number | null;
  timetable: string;
}
export function quote(course: Course, now = new Date()) {
  const early = now.getTime() <= new Date(course.early_deadline).getTime();
  return {
    amount: early ? course.early_price : course.regular_price,
    currency: 'KES' as const,
    tier: early ? ('early' as const) : ('regular' as const),
    early,
    deadline: course.early_deadline,
  };
}
export function registrationAvailable(course: Course, now = new Date()) {
  return (
    !!course.registration_open &&
    (!course.opens_at || now >= new Date(course.opens_at)) &&
    (!course.closes_at || now <= new Date(course.closes_at))
  );
}
export { money, currentWeek } from './format';
export function paymentMatches(
  expected: {
    reference: string;
    amount: number;
    currency: string;
    provider_mode: string;
    enrollment_id: string;
  },
  data: VerifiedPayment,
) {
  return (
    data.status === 'success' &&
    data.reference === expected.reference &&
    data.amount === expected.amount &&
    data.currency === expected.currency &&
    data.domain === expected.provider_mode &&
    data.metadata?.enrollment_id === expected.enrollment_id
  );
}
export interface VerifiedPayment {
  id: number | string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  domain: string;
  channel?: string;
  paid_at?: string;
  metadata?: { enrollment_id?: string };
}
export function csvCell(value: unknown) {
  const s = String(value ?? '');
  return '"' + (/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"';
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
