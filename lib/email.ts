import { first, statement, type AppEnv } from './db';
import { escapeHtml } from './domain';
import { assert } from './http';
type Outbox = {
  id: string;
  user_id: string | null;
  recipient: string;
  subject: string;
  html: string;
  kind: string;
  attempts: number;
};
export function emailTemplate(title: string, body: string) {
  return `<div style="background:#f3f6f9;padding:30px;font-family:Arial,sans-serif;color:#18243a"><div style="max-width:560px;margin:auto;background:white;padding:32px;border-radius:12px"><p style="font-size:24px;font-weight:bold">sanaa <span style="color:#708a5c">academy</span></p><h1 style="font-size:24px">${escapeHtml(title)}</h1>${body}<hr style="border:0;border-top:1px solid #e2e7ed;margin-top:30px"><p style="font-size:11px;color:#66758a">Sanaa Academy · From idea to live website, powered by AI.</p></div></div>`;
}
export async function queueEmail(
  e: AppEnv,
  input: {
    id: string;
    key: string;
    userId?: string;
    to: string;
    subject: string;
    html: string;
    kind: string;
  },
) {
  await statement(
    e,
    'INSERT OR IGNORE INTO email_outbox(id,dedupe_key,user_id,recipient,subject,html,kind) VALUES(?,?,?,?,?,?,?)',
    input.id,
    input.key,
    input.userId ?? null,
    input.to,
    input.subject,
    input.html,
    input.kind,
  ).run();
}
export async function deliverEmail(e: AppEnv, id: string) {
  assert(e.RESEND_API_KEY && e.EMAIL_FROM, 503, 'Email delivery is awaiting configuration.');
  const now = Math.floor(Date.now() / 1000);
  const row = await statement(
    e,
    `UPDATE email_outbox SET status='sending',attempts=attempts+1,lease_until=? WHERE id=? AND status!='sent' AND (status!='sending' OR lease_until<?) AND attempts<8 RETURNING id,user_id,recipient,subject,html,kind,attempts`,
    now + 90,
    id,
    now,
  ).first<Outbox>();
  if (!row)
    return (
      (await first<{ status: string }>(e, 'SELECT status FROM email_outbox WHERE id=?', id))
        ?.status === 'sent'
    );
  // Consent can change between queuing and delivery. Recheck it before every send/retry.
  if (
    row.kind === 'announcement' &&
    !(await first(
      e,
      "SELECT u.id FROM users u JOIN enrollments en ON en.user_id=u.id WHERE u.id=? AND u.updates_opt_in=1 AND en.status='active'",
      row.user_id,
    ))
  ) {
    await statement(
      e,
      "UPDATE email_outbox SET status='failed',attempts=8,lease_until=NULL,last_error='Suppressed: learner opted out or enrollment is no longer active.' WHERE id=?",
      id,
    ).run();
    return false;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${e.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': row.id,
      },
      body: JSON.stringify({
        from: e.EMAIL_FROM,
        to: [row.recipient],
        subject: row.subject,
        html:
          row.kind === 'welcome'
            ? emailTemplate('Your idea has a new beginning', row.html)
            : row.html,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`provider_${response.status}`);
    await statement(
      e,
      "UPDATE email_outbox SET status='sent',sent_at=CURRENT_TIMESTAMP,lease_until=NULL,html=CASE WHEN kind='login' THEN '' ELSE html END WHERE id=?",
      id,
    ).run();
    return true;
  } catch {
    await statement(
      e,
      "UPDATE email_outbox SET status='failed',lease_until=NULL,last_error='Delivery unavailable; retry from administration.' WHERE id=?",
      id,
    ).run();
    return false;
  }
}
export async function resendWelcome(e: AppEnv, userId: string) {
  const row = await first<{ recipient: string; subject: string; html: string }>(
    e,
    "SELECT recipient,subject,html FROM email_outbox WHERE user_id=? AND kind='welcome' ORDER BY created_at LIMIT 1",
    userId,
  );
  assert(row, 404, 'Enrollment confirmation message not found.');
  const id = crypto.randomUUID();
  await queueEmail(e, {
    id,
    key: id,
    userId,
    to: row.recipient,
    subject: row.subject,
    html: row.html,
    kind: 'welcome',
  });
  return deliverEmail(e, id);
}
