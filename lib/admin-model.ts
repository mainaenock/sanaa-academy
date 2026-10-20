import { z } from 'zod';
import { emailSchema, safeUrl } from './domain';
export type Field = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'datetime-local' | 'date' | 'checkbox' | 'select' | 'url';
  required?: boolean;
  options?: string[];
  hint?: string;
};
const title = z.string().trim().min(2).max(200),
  text = z.string().trim().max(30000),
  id = z.string().min(1).max(100),
  position = z.number().int().min(1).max(10000),
  flag = z.number().int().min(0).max(1);
const nullableUrl = z.union([safeUrl, z.literal(''), z.null()]).transform((v) => v || null),
  nullableId = z.union([id, z.literal(''), z.null()]).transform((v) => v || null);
const dateTime = z.iso.datetime({ offset: true }),
  optionalDateTime = z.union([dateTime, z.literal(''), z.null()]).transform((v) => v || null);
const titleField: Field = { key: 'title', label: 'Title', required: true },
  positionField: Field = {
    key: 'position',
    label: 'Display order',
    type: 'number',
    required: true,
  };
export const entities = {
  weeks: {
    label: 'Weeks',
    schema: z
      .object({ course_id: z.literal('ai-web-2026'), title, description: text, position })
      .strict(),
    fields: [
      titleField,
      { key: 'description', label: 'Description', type: 'textarea' },
      positionField,
    ] as Field[],
    order: 'position',
  },
  modules: {
    label: 'Modules',
    schema: z.object({ week_id: id, title, description: text, position }).strict(),
    fields: [
      { key: 'week_id', label: 'Week', required: true },
      titleField,
      { key: 'description', label: 'Description', type: 'textarea' },
      positionField,
    ] as Field[],
    order: 'week_id,position',
  },
  lessons: {
    label: 'Lessons',
    schema: z
      .object({
        module_id: id,
        title,
        description: text,
        outcomes: text,
        content: text,
        position,
        published: flag,
      })
      .strict(),
    fields: [
      { key: 'module_id', label: 'Module', required: true },
      titleField,
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'outcomes', label: 'Learning outcomes', type: 'textarea' },
      { key: 'content', label: 'Lesson content (plain text)', type: 'textarea' },
      positionField,
      { key: 'published', label: 'Published for enrolled learners', type: 'checkbox' },
    ] as Field[],
    order: 'module_id,position',
  },
  resources: {
    label: 'Resources',
    schema: z
      .object({
        course_id: z.literal('ai-web-2026'),
        lesson_id: nullableId,
        title,
        description: text,
        url: safeUrl,
        kind: z.enum(['documentation', 'notes', 'recording', 'download', 'tool']),
        position,
      })
      .strict(),
    fields: [
      titleField,
      { key: 'lesson_id', label: 'Linked lesson (optional)' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'url', label: 'Resource URL', type: 'url', required: true },
      {
        key: 'kind',
        label: 'Type',
        type: 'select',
        options: ['documentation', 'notes', 'recording', 'download', 'tool'],
      },
      positionField,
    ] as Field[],
    order: 'position',
  },
  assignments: {
    label: 'Assignments',
    schema: z
      .object({
        course_id: z.literal('ai-web-2026'),
        lesson_id: nullableId,
        title,
        description: text.min(2),
        due_at: optionalDateTime,
        position,
      })
      .strict(),
    fields: [
      titleField,
      { key: 'lesson_id', label: 'Linked lesson (optional)' },
      { key: 'description', label: 'Assignment instructions', type: 'textarea', required: true },
      {
        key: 'due_at',
        label: 'Deadline',
        type: 'datetime-local',
        hint: 'Dates are entered in your browser’s local timezone and stored in UTC.',
      },
      positionField,
    ] as Field[],
    order: 'position',
  },
  announcements: {
    label: 'Announcements',
    schema: z
      .object({ course_id: z.literal('ai-web-2026'), title, content: text.min(2), published: flag })
      .strict(),
    fields: [
      titleField,
      { key: 'content', label: 'Announcement', type: 'textarea', required: true },
      { key: 'published', label: 'Published', type: 'checkbox' },
    ] as Field[],
    order: 'created_at DESC',
  },
  live_sessions: {
    label: 'Live sessions',
    schema: z
      .object({
        course_id: z.literal('ai-web-2026'),
        title,
        starts_at: dateTime,
        ends_at: dateTime,
        platform: z.enum(['Google Meet', 'Zoom']),
        meeting_url: nullableUrl,
        notes: text,
        status: z.enum(['scheduled', 'completed', 'cancelled']),
      })
      .strict()
      .refine(
        (v) => new Date(v.ends_at) > new Date(v.starts_at),
        'End time must follow start time',
      ),
    fields: [
      titleField,
      {
        key: 'starts_at',
        label: 'Starts',
        type: 'datetime-local',
        required: true,
        hint: 'Your browser’s local timezone; stored in UTC.',
      },
      { key: 'ends_at', label: 'Ends', type: 'datetime-local', required: true },
      { key: 'platform', label: 'Platform', type: 'select', options: ['Google Meet', 'Zoom'] },
      { key: 'meeting_url', label: 'Private meeting URL', type: 'url' },
      { key: 'notes', label: 'Instructor notes', type: 'textarea' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: ['scheduled', 'completed', 'cancelled'],
      },
    ] as Field[],
    order: 'starts_at DESC',
  },
};
export type EntityName = keyof typeof entities;
export function isEntity(value: string): value is EntityName {
  return Object.hasOwn(entities, value);
}
export const courseFields: Field[] = [
  { key: 'title', label: 'Course name', required: true },
  { key: 'start_date', label: 'Start date', type: 'date', required: true },
  { key: 'end_date', label: 'End date', type: 'date', required: true },
  { key: 'duration_weeks', label: 'Duration in weeks', type: 'number', required: true },
  { key: 'timezone', label: 'Timezone', required: true },
  {
    key: 'regular_price',
    label: 'Regular fee in KES subunits',
    type: 'number',
    required: true,
    hint: 'KES 10,000 = 1,000,000 subunits.',
  },
  { key: 'early_price', label: 'Early-bird fee in KES subunits', type: 'number', required: true },
  { key: 'early_deadline', label: 'Early-bird expiry', type: 'datetime-local', required: true },
  { key: 'registration_open', label: 'Allow registration', type: 'checkbox' },
  { key: 'opens_at', label: 'Registration opens', type: 'datetime-local' },
  { key: 'closes_at', label: 'Registration closes', type: 'datetime-local' },
  { key: 'capacity', label: 'Cohort capacity (blank for unlimited)', type: 'number' },
  { key: 'timetable', label: 'Timetable and schedule notes', type: 'textarea' },
];
export const courseSchema = z
  .object({
    title,
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    duration_weeks: z.number().int().min(1).max(52),
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }, 'Use a valid IANA timezone'),
    regular_price: z.number().int().min(100).max(100000000),
    early_price: z.number().int().min(100).max(100000000),
    early_deadline: dateTime,
    registration_open: flag,
    opens_at: optionalDateTime,
    closes_at: optionalDateTime,
    capacity: z.number().int().min(1).max(100000).nullable(),
    timetable: text,
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.early_price > v.regular_price)
      ctx.addIssue({ code: 'custom', message: 'Early fee cannot exceed regular fee' });
    if (v.end_date < v.start_date)
      ctx.addIssue({ code: 'custom', message: 'Course end must follow start' });
    if (v.opens_at && v.closes_at && v.closes_at < v.opens_at)
      ctx.addIssue({ code: 'custom', message: 'Registration closing must follow opening' });
  });
export const siteSchema = z
  .object({
    heroHeadline: title,
    heroDescription: text.min(2),
    tagline: title,
    logoText: z.string().min(2).max(30),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    logoUrl: z.union([safeUrl, z.literal('')]),
    instructorName: title,
    instructorBio: text,
    instructorImage: z.union([safeUrl, z.literal('')]),
    instructorExperience: text,
    supportEmail: z.union([emailSchema, z.literal('')]),
    whatsapp: z.union([
      safeUrl.refine((v) => new URL(v).hostname === 'wa.me', 'Use a wa.me link'),
      z.literal(''),
    ]),
    socialLinks: z.array(z.object({ label: title, url: safeUrl })).max(10),
    footerText: text,
    benefits: z.array(z.object({ title, text })).min(1).max(12),
    faqs: z
      .array(z.object({ question: title, answer: text.min(2) }))
      .min(1)
      .max(40),
  })
  .strict();
