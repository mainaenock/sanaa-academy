import { describe, expect, it } from 'vitest';
import { env } from 'cloudflare:test';
import { all, course, first, statement, type AppEnv } from '../lib/db';
import { quote } from '../lib/domain';
import { studentData } from '../lib/student';

const e: AppEnv = env;
it('exposes the revised course and complete curriculum to an enrolled student', async () => {
  const userId = crypto.randomUUID();
  await statement(
    e,
    'INSERT INTO users(id,email) VALUES(?,?)',
    userId,
    userId + '@example.test',
  ).run();
  await statement(
    e,
    "INSERT INTO enrollments(id,user_id,course_id,status,terms_version) VALUES(?,?,'ai-web-2026','active','2026-10-17')",
    crypto.randomUUID(),
    userId,
  ).run();
  const portal = await studentData(e, userId);
  expect(portal.course.duration_weeks).toBe(5);
  expect(portal.weeks).toHaveLength(5);
  expect(portal.lessons).toHaveLength(15);
  expect(portal.assignments).toHaveLength(15);
  expect(portal.modules).toHaveLength(5);
  expect(portal.modules).toContainEqual(
    expect.objectContaining({ id: 'daily-module-5', week_id: 'week-5', position: 1 }),
  );
});
describe('five-week cohort revision', () => {
  it('publishes the revised dates, five ordered weeks, and one KES 5,000 fee', async () => {
    const current = await course(e);
    expect(current).toMatchObject({
      start_date: '2026-11-16',
      end_date: '2026-12-18',
      duration_weeks: 5,
      regular_price: 500000,
      early_price: 500000,
    });
    expect(quote(current)).toMatchObject({ amount: 500000, early: false });
    const weeks = await all<{ position: number }>(
      e,
      'SELECT position FROM weeks ORDER BY position',
    );
    expect(weeks.map((w) => w.position)).toEqual([1, 2, 3, 4, 5]);
  });

  it('moves capstone lessons into week five without losing assignments or recorded progress', async () => {
    // Reconstruct the original container to exercise the migration on existing learner data.
    await statement(
      e,
      "INSERT INTO weeks(id,course_id,title,position) VALUES('week-6','ai-web-2026','Launch your own thing',6)",
    ).run();
    await statement(e, "UPDATE modules SET week_id='week-6',position=1 WHERE id='module-6'").run();
    const userId = crypto.randomUUID();
    await statement(
      e,
      'INSERT INTO users(id,email) VALUES(?,?)',
      userId,
      userId + '@example.test',
    ).run();
    await statement(
      e,
      "INSERT INTO lesson_progress(user_id,lesson_id) VALUES(?,'lesson-6-1')",
      userId,
    ).run();
    const revision = env.TEST_MIGRATIONS.find((m) => m.name.startsWith('0005_'));
    expect(revision).toBeDefined();
    await e.DB.batch(revision!.queries.map((sql) => e.DB.prepare(sql)));
    expect(await first(e, "SELECT id FROM weeks WHERE id='week-6'")).toBeNull();
    expect(
      await first(e, "SELECT week_id,position FROM modules WHERE id='module-6'"),
    ).toMatchObject({
      week_id: 'week-5',
      position: 2,
    });
    expect((await all(e, 'SELECT id FROM lessons')).length).toBe(27);
    expect((await all(e, 'SELECT id FROM assignments')).length).toBe(27);
    expect(
      await first(
        e,
        "SELECT lesson_id FROM lesson_progress WHERE user_id=? AND lesson_id='lesson-6-1'",
        userId,
      ),
    ).toBeTruthy();
  });
});
