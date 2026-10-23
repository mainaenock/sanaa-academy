ALTER TABLE users ADD COLUMN password_hash TEXT;
DROP TRIGGER payment_activated;
CREATE TRIGGER payment_activated AFTER UPDATE OF status ON transactions WHEN NEW.status='success' AND OLD.status!='success'
BEGIN
 UPDATE enrollments SET status='active',activated_at=COALESCE(activated_at,CURRENT_TIMESTAMP) WHERE id=NEW.enrollment_id;
 INSERT OR IGNORE INTO email_outbox(id,dedupe_key,user_id,recipient,subject,html,kind)
 SELECT 'welcome-'||NEW.enrollment_id,'welcome-'||NEW.enrollment_id,u.id,u.email,'You are enrolled — Sanaa Academy',
 '<h1>Welcome to Sanaa Academy</h1><p>Your enrollment is confirmed.</p><p>Payment: KES '||(NEW.amount/100)||'. Reference: '||NEW.reference||'.</p><p>Open the academy website and sign in with the email and password you used when registering. Class days and meeting details are available in your portal when scheduled.</p>', 'welcome'
 FROM enrollments e JOIN users u ON u.id=e.user_id WHERE e.id=NEW.enrollment_id;
END;
