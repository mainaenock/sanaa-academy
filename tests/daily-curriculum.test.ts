import { describe, expect, it } from 'vitest';
import { env } from 'cloudflare:test';
import { handleApi } from '../lib/api';
import { all, first, site, statement, type AppEnv } from '../lib/db';
import { studentData } from '../lib/student';
import { publicCurriculum } from '../lib/curriculum';
import type { StudentData } from '../lib/view-types';

const e: AppEnv = env;

async function learner(status = 'active') {
  const id = crypto.randomUUID();
  await statement(e, 'INSERT INTO users(id,email) VALUES(?,?)', id, id + '@example.test').run();
  await statement(
    e,
    "INSERT INTO enrollments(id,user_id,course_id,status,terms_version) VALUES(?,?,'ai-web-2026',?,'test')",
    crypto.randomUUID(),
    id,
    status,
  ).run();
  return id;
}

describe('public overview and protected daily curriculum', () => {
  it('provides three ordered days per week and the technical plans only to enrolled learners', async () => {
    const portal = (await studentData(e, await learner())) as unknown as StudentData;
    expect(portal.weeks).toHaveLength(5);
    expect(portal.modules).toHaveLength(5);
    expect(portal.lessons).toHaveLength(15);
    expect(portal.assignments).toHaveLength(15);
    for (const [i, week] of publicCurriculum.entries()) {
      expect(portal.weeks[i].title).toBe(week.title);
      const module = portal.modules.find((m) => m.week_id === portal.weeks[i].id)!;
      const lessons = portal.lessons.filter((l) => l.module_id === module.id);
      expect(lessons.map((l) => l.title.split(' · ')[0])).toEqual([
        'Monday',
        'Wednesday',
        'Friday',
      ]);
      expect(lessons.map((l) => l.position)).toEqual([1, 2, 3]);
      for (const lesson of lessons) {
        for (const section of [
          'Tools and concepts',
          'In class',
          'Direct the AI',
          'Check your work',
          'Practice and deliverable',
        ]) {
          expect(lesson.content).toContain(section);
        }
        expect(portal.assignments.filter((a) => a.lesson_id === lesson.id)).toHaveLength(1);
      }
    }
    expect(portal.lessons[1].content).toContain('HTML');
    expect(portal.lessons[2].content).toContain('CSS');
    expect(portal.lessons[3].content).toContain('JavaScript');
    expect(portal.lessons[6].content).toContain('notes app');
    expect(portal.lessons[9].content).toContain('React');
    expect(portal.lessons[11].content).toContain('SQLite SQL');
    expect(portal.lessons[13].content).toContain('Worker Custom Domains');
    expect(portal.lessons[13].content).toContain('HTTPS');
    expect(JSON.stringify(publicCurriculum)).not.toMatch(/fetch|PWA|SQLite|npm|JSX/);
  });

  it('keeps lesson content out of public responses and rejects anonymous or pending learners', async () => {
    const response = await handleApi(new Request('http://localhost:5173/api/public'), e);
    const data = (await response.json()) as Record<string, unknown>;
    expect(data).not.toHaveProperty('lessons');
    expect(JSON.stringify(data)).not.toContain('Tools and concepts');
    expect((await handleApi(new Request('http://localhost:5173/api/student'), e)).status).toBe(401);
    await expect(studentData(e, await learner('pending'))).rejects.toMatchObject({ status: 403 });
  });

  it('preserves past progress and submissions while publishing the new plan without duplicate tasks', async () => {
    const userId = await learner();
    await statement(
      e,
      "INSERT INTO lesson_progress(user_id,lesson_id) VALUES(?,'lesson-1-1')",
      userId,
    ).run();
    const submissionId = crypto.randomUUID();
    await statement(
      e,
      "INSERT INTO submissions(id,assignment_id,user_id,description) VALUES(?,'assignment-1-1',?,'My original project work')",
      submissionId,
      userId,
    ).run();
    // Recreate the prior content state and run the real migration over existing records.
    await statement(e, "DELETE FROM assignments WHERE id LIKE 'daily-assignment-%'").run();
    await statement(e, "DELETE FROM modules WHERE id LIKE 'daily-module-%'").run();
    await statement(e, 'UPDATE lessons SET published=1').run();
    await statement(
      e,
      "INSERT OR REPLACE INTO site_settings(key,value) VALUES('website',?)",
      JSON.stringify({
        heroHeadline: 'Keep my custom headline',
        faqs: [
          { question: 'Are classes live?', answer: 'Old timetable' },
          { question: 'Will I need hosting or a domain?', answer: 'Old hosting answer' },
          { question: 'My own question', answer: 'Keep my custom answer' },
        ],
      }),
    ).run();
    const migration = env.TEST_MIGRATIONS.find((m) => m.name.startsWith('0006_'))!;
    await e.DB.batch(migration.queries.map((sql) => e.DB.prepare(sql)));
    expect(await first(e, "SELECT published FROM lessons WHERE id='lesson-1-1'")).toMatchObject({
      published: 0,
    });
    expect(
      await first(e, 'SELECT lesson_id FROM lesson_progress WHERE user_id=?', userId),
    ).toMatchObject({ lesson_id: 'lesson-1-1' });
    expect(
      await first(e, 'SELECT description FROM submissions WHERE id=?', submissionId),
    ).toMatchObject({ description: 'My original project work' });
    expect(await all(e, 'SELECT id FROM lessons')).toHaveLength(27);
    const portal = await studentData(e, userId);
    expect(portal.lessons).toHaveLength(15);
    expect(portal.assignments).toHaveLength(15);
    expect(portal.modules).toHaveLength(5);
    const settings = await site(e);
    expect(settings.heroHeadline).toBe('Keep my custom headline');
    expect(settings.faqs[0].answer).toContain('Monday, Wednesday, and Friday');
    expect(settings.faqs[1].answer).toContain('chosen domain');
    expect(settings.faqs[2].answer).toBe('Keep my custom answer');
  });
});
