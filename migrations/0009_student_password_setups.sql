CREATE TABLE student_password_setups (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at INTEGER NOT NULL
);

ALTER TABLE enrollments ADD COLUMN offline_enrolled INTEGER NOT NULL DEFAULT 0 CHECK(offline_enrolled IN (0,1));

DROP TRIGGER payment_activated;
CREATE TRIGGER payment_activated AFTER UPDATE OF status ON transactions
WHEN NEW.status='success' AND OLD.status!='success'
 AND EXISTS(SELECT 1 FROM enrollments WHERE id=NEW.enrollment_id AND offline_enrolled=0)
BEGIN
 UPDATE enrollments SET status='active',activated_at=COALESCE(activated_at,CURRENT_TIMESTAMP) WHERE id=NEW.enrollment_id;
 INSERT OR IGNORE INTO email_outbox(id,dedupe_key,user_id,recipient,subject,html,kind)
 SELECT 'welcome-'||NEW.enrollment_id,'welcome-'||NEW.enrollment_id,u.id,u.email,'You are enrolled — Sanaa Academy',
 '<h1>Welcome to Sanaa Academy</h1><p>Your enrollment is confirmed.</p><p>Payment: KES '||(NEW.amount/100)||'. Reference: '||NEW.reference||'.</p><p>Open the academy website and sign in with the email and password you used when registering. Class days and meeting details are available in your portal when scheduled.</p>', 'welcome'
 FROM enrollments e JOIN users u ON u.id=e.user_id WHERE e.id=NEW.enrollment_id;
END;

DROP TRIGGER payment_revoked;
CREATE TRIGGER payment_revoked AFTER UPDATE OF status ON transactions
WHEN NEW.status IN ('refunded','reversed') AND OLD.status='success'
BEGIN
 UPDATE enrollments SET status=NEW.status WHERE id=NEW.enrollment_id AND offline_enrolled=0
 AND NOT EXISTS(SELECT 1 FROM transactions WHERE enrollment_id=NEW.enrollment_id AND status='success');
END;
