import { z } from 'zod';
import { requireEnrollment, requireSession, userExport } from './auth';
import { all, course, first, statement, type AppEnv } from './db';
import { assert } from './http';
import { safeUrl } from './domain';
export async function studentData(e: AppEnv, userId: string) {
  const en = await requireEnrollment(e, userId),
    c = await course(e);
  const [
    weeks,
    modules,
    lessons,
    progress,
    resources,
    assignments,
    submissions,
    announcements,
    sessions,
  ] = await Promise.all([
    all(e, 'SELECT * FROM weeks WHERE course_id=? ORDER BY position', en.course_id),
    all(
      e,
      'SELECT m.* FROM modules m JOIN weeks w ON w.id=m.week_id WHERE w.course_id=? ORDER BY w.position,m.position',
      en.course_id,
    ),
    all(
      e,
      'SELECT l.* FROM lessons l JOIN modules m ON m.id=l.module_id JOIN weeks w ON w.id=m.week_id WHERE w.course_id=? AND l.published=1 ORDER BY w.position,m.position,l.position',
      en.course_id,
    ),
    all<{ lesson_id: string }>(
      e,
      'SELECT lesson_id,completed_at FROM lesson_progress WHERE user_id=?',
      userId,
    ),
    all(e, 'SELECT * FROM resources WHERE course_id=? ORDER BY position', en.course_id),
    all(e, 'SELECT * FROM assignments WHERE course_id=? ORDER BY position', en.course_id),
    all(
      e,
      'SELECT s.* FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.user_id=? AND a.course_id=?',
      userId,
      en.course_id,
    ),
    all(
      e,
      'SELECT * FROM announcements WHERE course_id=? AND published=1 ORDER BY created_at DESC',
      en.course_id,
    ),
    all(e, 'SELECT * FROM live_sessions WHERE course_id=? ORDER BY starts_at', en.course_id),
  ]);
  return {
    course: c,
    weeks,
    modules,
    lessons,
    progress,
    resources,
    assignments,
    submissions,
    announcements,
    sessions,
  };
}
export async function updateProgress(request: Request, e: AppEnv, input: unknown, admin = false) {
  const session = await requireSession(request, e, admin),
    data = z
      .object({
        lessonId: z.string().max(100),
        completed: z.boolean(),
        userId: z.string().optional(),
      })
      .parse(input);
  const userId = admin ? (data.userId ?? session.user.id) : session.user.id;
  const en = await requireEnrollment(e, userId);
  assert(
    await first(
      e,
      'SELECT l.id FROM lessons l JOIN modules m ON m.id=l.module_id JOIN weeks w ON w.id=m.week_id WHERE l.id=? AND w.course_id=? AND l.published=1',
      data.lessonId,
      en.course_id,
    ),
    404,
    'Lesson not found.',
  );
  const change = data.completed
    ? statement(
        e,
        'INSERT OR IGNORE INTO lesson_progress(user_id,lesson_id) VALUES(?,?)',
        userId,
        data.lessonId,
      )
    : statement(
        e,
        'DELETE FROM lesson_progress WHERE user_id=? AND lesson_id=?',
        userId,
        data.lessonId,
      );
  await e.DB.batch([
    change,
    ...(admin
      ? [
          statement(
            e,
            'INSERT INTO admin_audit_logs(id,actor_id,action,entity_type,entity_id,details) VALUES(?,?,?,?,?,?)',
            crypto.randomUUID(),
            session.user.id,
            'progress_correction',
            'lesson_progress',
            userId,
            JSON.stringify({ lessonId: data.lessonId, completed: data.completed }),
          ),
        ]
      : []),
  ]);
  return Response.json({ ok: true });
}
export async function submitAssignment(request: Request, e: AppEnv, input: unknown) {
  const s = await requireSession(request, e),
    en = await requireEnrollment(e, s.user.id);
  const data = z
    .object({
      assignmentId: z.string(),
      description: z.string().trim().min(20).max(10000),
      githubUrl: z.union([
        safeUrl.refine(
          (v) => new URL(v).hostname === 'github.com',
          'Use a github.com repository URL',
        ),
        z.literal(''),
      ]),
      websiteUrl: z.union([safeUrl, z.literal('')]),
    })
    .parse(input);
  assert(
    await first(
      e,
      'SELECT id FROM assignments WHERE id=? AND course_id=?',
      data.assignmentId,
      en.course_id,
    ),
    404,
    'Assignment not found.',
  );
  await statement(
    e,
    "INSERT INTO submissions(id,assignment_id,user_id,description,github_url,website_url) VALUES(?,?,?,?,?,?) ON CONFLICT(assignment_id,user_id) DO UPDATE SET description=excluded.description,github_url=excluded.github_url,website_url=excluded.website_url,status='submitted',updated_at=CURRENT_TIMESTAMP",
    crypto.randomUUID(),
    data.assignmentId,
    s.user.id,
    data.description,
    data.githubUrl || null,
    data.websiteUrl || null,
  ).run();
  return Response.json({ ok: true });
}
export async function updateProfile(request: Request, e: AppEnv, input: unknown) {
  const s = await requireSession(request, e);
  const v = z
    .object({
      name: z.string().trim().min(2).max(120),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9 ()-]{9,22}$/),
      projectInterest: z.string().trim().max(2000),
      updatesOptIn: z.boolean(),
    })
    .parse(input);
  await statement(
    e,
    'UPDATE users SET name=?,phone=?,project_interest=?,updates_opt_in=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    v.name,
    v.phone,
    v.projectInterest,
    Number(v.updatesOptIn),
    s.user.id,
  ).run();
  return Response.json({ ok: true });
}
export async function privacy(request: Request, e: AppEnv, input: unknown) {
  const s = await requireSession(request, e),
    v = z.object({ kind: z.enum(['export', 'delete']) }).parse(input);
  if (v.kind === 'export')
    return Response.json(await userExport(e, s.user.id), {
      headers: { 'Content-Disposition': 'attachment; filename="sanaa-personal-data.json"' },
    });
  await e.DB.batch([
    statement(
      e,
      "INSERT INTO privacy_requests(id,user_id,kind) SELECT ?,?,'delete' WHERE NOT EXISTS(SELECT 1 FROM privacy_requests WHERE user_id=? AND kind='delete' AND status='pending')",
      crypto.randomUUID(),
      s.user.id,
      s.user.id,
    ),
    statement(
      e,
      'UPDATE users SET deletion_requested_at=CURRENT_TIMESTAMP,updates_opt_in=0 WHERE id=?',
      s.user.id,
    ),
  ]);
  return Response.json({
    message:
      'Your deletion request is recorded. The academy will review necessary financial retention and contact you.',
  });
}
