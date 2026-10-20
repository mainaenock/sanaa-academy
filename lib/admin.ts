import { z } from 'zod';
import { requireEnrollment, requireSession } from './auth';
import { entities, isEntity, courseSchema, siteSchema } from './admin-model';
import { all, course, first, site, statement, type AppEnv } from './db';
import { assert, HttpError } from './http';
import { COURSE_ID, csvCell, escapeHtml } from './domain';
import { deliverEmail, emailTemplate, resendWelcome } from './email';
import { digest, randomToken } from './crypto';
export const studentSelect = `SELECT u.id,u.email,u.name,u.phone,u.age_category,u.created_at,en.id enrollment_id,en.status enrollment_status,en.activated_at,(SELECT COUNT(*) FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id JOIN modules m ON m.id=l.module_id JOIN weeks w ON w.id=m.week_id WHERE p.user_id=u.id AND l.published=1 AND w.course_id='ai-web-2026') completed_lessons FROM users u LEFT JOIN enrollments en ON en.user_id=u.id AND en.course_id='ai-web-2026' WHERE u.role='student'`;
export async function adminOverview(e: AppEnv) {
  const [counts, payments, progress, upcoming, recent, privacy, emails] = await Promise.all([
    first(
      e,
      "SELECT COUNT(*) total,SUM(status='active') paid,SUM(status='pending') pending FROM enrollments WHERE course_id=?",
      COURSE_ID,
    ),
    first(
      e,
      "SELECT COALESCE(SUM(CASE WHEN status='success' AND provider_mode='live' THEN amount ELSE 0 END),0) revenue,SUM(status='success' AND pricing_tier='early') early,SUM(status='success' AND pricing_tier='regular') regular,SUM(status='success' AND provider_mode='test') test_payments FROM transactions",
    ),
    first(
      e,
      "SELECT COUNT(*) completed FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id JOIN enrollments en ON en.user_id=p.user_id WHERE l.published=1 AND en.status='active' AND en.course_id=?",
      COURSE_ID,
    ),
    all(
      e,
      "SELECT id,title,starts_at,platform FROM live_sessions WHERE status='scheduled' AND starts_at>? ORDER BY starts_at LIMIT 5",
      new Date().toISOString(),
    ),
    all(
      e,
      'SELECT t.reference,t.amount,t.currency,t.status,t.provider_mode,t.created_at,u.name FROM transactions t JOIN enrollments en ON en.id=t.enrollment_id JOIN users u ON u.id=en.user_id ORDER BY t.created_at DESC LIMIT 6',
    ),
    first(e, "SELECT COUNT(*) count FROM privacy_requests WHERE status='pending'"),
    first(
      e,
      "SELECT COUNT(*) count FROM email_outbox WHERE status IN ('failed','pending') AND kind!='login'",
    ),
  ]);
  const lessons = await first<{ count: number }>(
    e,
    'SELECT COUNT(*) count FROM lessons WHERE published=1',
  );
  return {
    counts,
    payments,
    progress,
    lessonCount: lessons?.count ?? 0,
    upcoming,
    recent,
    privacy,
    emails,
  };
}
export async function students(e: AppEnv, url: URL) {
  const search = (url.searchParams.get('q') ?? '').slice(0, 120),
    status = url.searchParams.get('status') ?? '',
    page = Math.max(0, Math.min(10000, Number(url.searchParams.get('page')) || 0));
  let sql = studentSelect + ' AND (u.name LIKE ? OR u.email LIKE ?)';
  const args: unknown[] = ['%' + search + '%', '%' + search + '%'];
  if (status) {
    assert(
      ['pending', 'active', 'refunded', 'reversed', 'cancelled'].includes(status),
      400,
      'Invalid status',
    );
    sql += ' AND en.status=?';
    args.push(status);
  }
  return all(e, sql + ' ORDER BY u.created_at DESC LIMIT 100 OFFSET ?', ...args, page * 100);
}
export async function studentDetail(e: AppEnv, id: string) {
  const user = await first(e, studentSelect + ' AND u.id=?', id);
  assert(user, 404, 'Student not found');
  return {
    user,
    guardian: await first(e, 'SELECT * FROM guardians WHERE user_id=?', id),
    progress: await all(
      e,
      'SELECT p.*,l.title FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=?',
      id,
    ),
    submissions: await all(
      e,
      'SELECT s.*,a.title FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.user_id=?',
      id,
    ),
    payments: await all(
      e,
      'SELECT t.* FROM transactions t JOIN enrollments en ON en.id=t.enrollment_id WHERE en.user_id=? ORDER BY t.created_at DESC',
      id,
    ),
    lessons: await all(e, 'SELECT id,title FROM lessons WHERE published=1 ORDER BY position'),
  };
}
function audit(e: AppEnv, actor: string, action: string, entity: string, id: string, details = '') {
  return statement(
    e,
    'INSERT INTO admin_audit_logs(id,actor_id,action,entity_type,entity_id,details) VALUES(?,?,?,?,?,?)',
    crypto.randomUUID(),
    actor,
    action,
    entity,
    id,
    details,
  );
}
export async function adminRead(e: AppEnv, resource: string, url: URL) {
  if (resource === 'overview') return adminOverview(e);
  if (resource === 'students') return students(e, url);
  if (resource === 'student') return studentDetail(e, url.searchParams.get('id') ?? '');
  if (resource === 'payments')
    return all(
      e,
      'SELECT t.*,u.name learner_name,u.email learner_account FROM transactions t JOIN enrollments en ON en.id=t.enrollment_id JOIN users u ON u.id=en.user_id ORDER BY t.created_at DESC LIMIT 500',
    );
  if (resource === 'settings') return course(e);
  if (resource === 'website') return site(e);
  if (resource === 'audit')
    return all(e, 'SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 200');
  if (resource === 'emails')
    return all(
      e,
      "SELECT id,recipient,subject,kind,status,attempts,last_error,sent_at,created_at FROM email_outbox WHERE kind!='login' ORDER BY created_at DESC LIMIT 200",
    );
  if (resource === 'privacy')
    return all(
      e,
      'SELECT p.*,u.email,u.name FROM privacy_requests p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 200',
    );
  if (isEntity(resource))
    return all(e, `SELECT * FROM ${resource} ORDER BY ${entities[resource].order} LIMIT 1000`);
  throw new HttpError(404, 'Resource not found');
}
export async function adminWrite(request: Request, e: AppEnv, resource: string, input: unknown) {
  const s = await requireSession(request, e, true);
  if (resource === 'settings') {
    const v = courseSchema.parse(input),
      keys = Object.keys(v);
    await e.DB.batch([
      statement(
        e,
        `UPDATE courses SET ${keys.map((k) => k + '=?').join(',')} WHERE id=?`,
        ...Object.values(v),
        COURSE_ID,
      ),
      audit(e, s.user.id, 'update', 'course', COURSE_ID),
    ]);
    return { ok: true };
  }
  if (resource === 'website') {
    const v = siteSchema.parse(input);
    await e.DB.batch([
      statement(
        e,
        "INSERT INTO site_settings(key,value) VALUES('website',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP",
        JSON.stringify(v),
      ),
      audit(e, s.user.id, 'update', 'website', 'website'),
    ]);
    return { ok: true };
  }
  if (resource === 'feedback') {
    const v = z
      .object({
        id: z.string(),
        status: z.enum(['reviewed', 'needs_revision', 'accepted']),
        feedback: z.string().trim().min(2).max(10000),
      })
      .parse(input);
    assert(
      await first(e, 'SELECT id FROM submissions WHERE id=?', v.id),
      404,
      'Submission not found',
    );
    await e.DB.batch([
      statement(
        e,
        'UPDATE submissions SET status=?,feedback=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
        v.status,
        v.feedback,
        v.id,
      ),
      audit(e, s.user.id, 'feedback', 'submissions', v.id),
    ]);
    return { ok: true };
  }
  if (resource === 'resend') {
    const v = z.object({ userId: z.string() }).parse(input);
    const en = await requireEnrollment(e, v.userId);
    const sent = await resendWelcome(e, v.userId);
    await audit(e, s.user.id, 'resend_confirmation', 'enrollments', en.id).run();
    return {
      ok: sent,
      message: sent ? 'Confirmation email sent.' : 'Delivery failed; enrollment remains active.',
    };
  }
  if (resource === 'retry-email') {
    const v = z.object({ id: z.string() }).parse(input);
    assert(
      await first(e, "SELECT id FROM email_outbox WHERE id=? AND kind!='login'", v.id),
      404,
      'Email not found',
    );
    await statement(
      e,
      "UPDATE email_outbox SET attempts=0,status='pending',lease_until=NULL WHERE id=? AND status!='sending'",
      v.id,
    ).run();
    const ok = await deliverEmail(e, v.id);
    await audit(e, s.user.id, 'retry_email', 'email_outbox', v.id).run();
    return { ok, message: ok ? 'Email delivered.' : 'Delivery is unavailable.' };
  }
  if (resource === 'send-announcement') return sendAnnouncement(e, s.user.id, input);
  if (resource === 'privacy-action') return privacyAction(e, s.user.id, input);
  if (resource === 'cancel-enrollment') {
    const v = z.object({ id: z.string() }).parse(input);
    assert(
      !(await first(
        e,
        "SELECT id FROM transactions WHERE enrollment_id=? AND status IN ('pending','success')",
        v.id,
      )),
      409,
      'Reconcile pending payments before cancelling this reservation.',
    );
    await e.DB.batch([
      statement(
        e,
        "UPDATE enrollments SET status='cancelled' WHERE id=? AND status='pending'",
        v.id,
      ),
      audit(e, s.user.id, 'cancel', 'enrollments', v.id),
    ]);
    return { ok: true };
  }
  assert(isEntity(resource), 404, 'Resource not found');
  const envelope = z.object({ id: z.string().max(100).optional(), data: z.unknown() }).parse(input);
  const v = entities[resource].schema.parse(envelope.data),
    keys = Object.keys(v),
    recordId = envelope.id ?? crypto.randomUUID();
  if (envelope.id)
    assert(
      await first(e, `SELECT id FROM ${resource} WHERE id=?`, recordId),
      404,
      'Record not found',
    );
  const mutation = envelope.id
    ? statement(
        e,
        `UPDATE ${resource} SET ${keys.map((k) => k + '=?').join(',')} WHERE id=?`,
        ...Object.values(v),
        recordId,
      )
    : statement(
        e,
        `INSERT INTO ${resource}(id,${keys.join(',')}) VALUES(${Array(keys.length + 1)
          .fill('?')
          .join(',')})`,
        recordId,
        ...Object.values(v),
      );
  try {
    await e.DB.batch([
      mutation,
      audit(e, s.user.id, envelope.id ? 'update' : 'create', resource, recordId),
    ]);
  } catch {
    throw new HttpError(400, 'Save failed. Check parent records, dates, and required fields.');
  }
  return { ok: true, id: recordId };
}
export async function adminDelete(request: Request, e: AppEnv, resource: string, id: string) {
  const s = await requireSession(request, e, true);
  assert(isEntity(resource), 400, 'This resource cannot be deleted');
  assert(await first(e, `SELECT id FROM ${resource} WHERE id=?`, id), 404, 'Record not found');
  await e.DB.batch([
    statement(e, `DELETE FROM ${resource} WHERE id=?`, id),
    audit(e, s.user.id, 'delete', resource, id),
  ]);
  return { ok: true };
}
export async function exportStudents(request: Request, e: AppEnv, url: URL) {
  const s = await requireSession(request, e, true);
  const rows = await students(e, url),
    headers = [
      'name',
      'email',
      'phone',
      'age_category',
      'enrollment_status',
      'completed_lessons',
      'created_at',
    ];
  await audit(e, s.user.id, 'export', 'students', 'filtered').run();
  return new Response(
    [
      headers.map(csvCell).join(','),
      ...rows.map((row) =>
        headers.map((k) => csvCell((row as Record<string, unknown>)[k])).join(','),
      ),
    ].join('\r\n'),
    {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sanaa-students.csv"',
      },
    },
  );
}
async function sendAnnouncement(e: AppEnv, actor: string, input: unknown) {
  const v = z.object({ id: z.string(), confirmed: z.literal(true) }).parse(input),
    ann = await first<{ title: string; content: string }>(
      e,
      'SELECT title,content FROM announcements WHERE id=? AND published=1',
      v.id,
    );
  assert(ann, 404, 'Publish the announcement before emailing it.');
  assert(e.RESEND_API_KEY && e.EMAIL_FROM, 503, 'Email provider is not configured.');
  // Bounded batches of 20; repeated actions pick up unsent recipients through a unique per-announcement key.
  const recipients = await all<{ id: string; email: string }>(
    e,
    "SELECT u.id,u.email FROM users u JOIN enrollments en ON en.user_id=u.id WHERE en.course_id=? AND en.status='active' AND u.updates_opt_in=1 AND NOT EXISTS(SELECT 1 FROM email_outbox o WHERE o.dedupe_key=?||u.id) LIMIT 20",
    COURSE_ID,
    'announcement-' + v.id + '-',
  );
  for (const user of recipients) {
    const token = randomToken(),
      emailId = crypto.randomUUID();
    await e.DB.batch([
      statement(
        e,
        "INSERT INTO auth_tokens(token_hash,email,purpose,expires_at) VALUES(?,?,'unsubscribe',?)",
        await digest(token),
        user.email,
        Math.floor(Date.now() / 1000) + 31536000,
      ),
      statement(
        e,
        'INSERT OR IGNORE INTO email_outbox(id,dedupe_key,user_id,recipient,subject,html,kind) VALUES(?,?,?,?,?,?,?)',
        emailId,
        'announcement-' + v.id + '-' + user.id,
        user.id,
        user.email,
        ann.title,
        emailTemplate(
          ann.title,
          `<p style="white-space:pre-wrap">${escapeHtml(ann.content)}</p><p><a href="${escapeHtml(e.APP_URL)}/portal">Open your student portal</a></p><p><a href="${escapeHtml(e.APP_URL)}/unsubscribe?token=${token}">Stop course update emails</a></p>`,
        ),
        'announcement',
      ),
    ]);
  }
  // Delivery is deliberately bounded to avoid a request timing out; remaining rows can be retried from the outbox.
  const pending = await all<{ id: string }>(
    e,
    "SELECT id FROM email_outbox WHERE dedupe_key LIKE ? AND status='pending' LIMIT 3",
    'announcement-' + v.id + '-%',
  );
  for (const row of pending) await deliverEmail(e, row.id);
  await audit(
    e,
    actor,
    'queue_announcement',
    'announcements',
    v.id,
    JSON.stringify({ queued: recipients.length }),
  ).run();
  return {
    ok: true,
    message: `Queued ${recipients.length} opted-in recipients. Up to 3 delivered now; use the email outbox for remaining deliveries. Repeat to queue the next 20.`,
  };
}
async function privacyAction(e: AppEnv, actor: string, input: unknown) {
  const v = z
      .object({
        id: z.string(),
        action: z.enum(['fulfill', 'decline']),
        notes: z.string().trim().min(10).max(3000),
        confirm: z.literal(true),
      })
      .parse(input),
    row = await first<{ user_id: string; status: string }>(
      e,
      "SELECT user_id,status FROM privacy_requests WHERE id=? AND kind='delete'",
      v.id,
    );
  assert(row && row.status === 'pending', 409, 'This request is no longer pending.');
  if (v.action === 'decline') {
    await e.DB.batch([
      statement(
        e,
        "UPDATE privacy_requests SET status='declined',notes=? WHERE id=?",
        v.notes,
        v.id,
      ),
      audit(e, actor, 'decline_deletion', 'privacy_requests', v.id, v.notes),
    ]);
    return { ok: true };
  }
  const anonymized = row.user_id + '@deleted.invalid';
  await e.DB.batch([
    statement(e, 'DELETE FROM guardians WHERE user_id=?', row.user_id),
    statement(e, 'DELETE FROM auth_sessions WHERE user_id=?', row.user_id),
    statement(
      e,
      'DELETE FROM auth_tokens WHERE email=(SELECT email FROM users WHERE id=?)',
      row.user_id,
    ),
    statement(e, 'DELETE FROM lesson_progress WHERE user_id=?', row.user_id),
    statement(e, 'DELETE FROM submissions WHERE user_id=?', row.user_id),
    statement(e, 'DELETE FROM email_outbox WHERE user_id=?', row.user_id),
    statement(
      e,
      'UPDATE transactions SET payer_email=? WHERE enrollment_id IN (SELECT id FROM enrollments WHERE user_id=?)',
      anonymized,
      row.user_id,
    ),
    statement(e, "UPDATE enrollments SET status='cancelled' WHERE user_id=?", row.user_id),
    statement(
      e,
      "UPDATE users SET email=?,name='Deleted learner',phone='',age_category=NULL,experience='',project_interest='',updates_opt_in=0,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      anonymized,
      row.user_id,
    ),
    statement(
      e,
      "UPDATE privacy_requests SET status='fulfilled',notes=? WHERE id=?",
      v.notes,
      v.id,
    ),
    audit(
      e,
      actor,
      'anonymize',
      'users',
      row.user_id,
      'Financial transaction references and audit trail retained; personal learning data removed.',
    ),
  ]);
  return { ok: true };
}
