import type { Course } from './domain';
export function money(subunits: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(subunits / 100);
}
export function currentWeek(course: Course, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: course.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const day = Date.UTC(part('year'), part('month') - 1, part('day'));
  return Math.max(
    0,
    Math.min(
      course.duration_weeks,
      Math.floor((day - new Date(course.start_date + 'T00:00:00Z').getTime()) / 604800000) + 1,
    ),
  );
}
