PRAGMA foreign_keys = ON;
CREATE TABLE users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
 role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')), age_category TEXT CHECK(age_category IN ('adult','minor')),
 experience TEXT NOT NULL DEFAULT '', project_interest TEXT NOT NULL DEFAULT '', updates_opt_in INTEGER NOT NULL DEFAULT 0 CHECK(updates_opt_in IN (0,1)),
 verified_at TEXT, deletion_requested_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE guardians (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
 learner_email TEXT NOT NULL, consent_at TEXT NOT NULL, consent_version TEXT NOT NULL, verified_at TEXT NOT NULL
);
CREATE TABLE courses (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, duration_weeks INTEGER NOT NULL CHECK(duration_weeks>0), timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
 regular_price INTEGER NOT NULL CHECK(regular_price>0), early_price INTEGER NOT NULL CHECK(early_price>0 AND early_price<=regular_price), early_deadline TEXT NOT NULL,
 registration_open INTEGER NOT NULL DEFAULT 1 CHECK(registration_open IN (0,1)), opens_at TEXT, closes_at TEXT, capacity INTEGER CHECK(capacity IS NULL OR capacity>0), timetable TEXT NOT NULL DEFAULT 'Class days and times will be announced.',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE enrollments (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), course_id TEXT NOT NULL REFERENCES courses(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','refunded','reversed','cancelled')), terms_version TEXT NOT NULL,
 activated_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id,course_id)
);
CREATE TABLE transactions (
 id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, enrollment_id TEXT NOT NULL REFERENCES enrollments(id), payer_email TEXT NOT NULL,
 amount INTEGER NOT NULL CHECK(amount>0), currency TEXT NOT NULL DEFAULT 'KES' CHECK(currency='KES'), pricing_tier TEXT NOT NULL CHECK(pricing_tier IN ('early','regular')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','failed','success','refunded','reversed','abandoned')), provider_id TEXT UNIQUE,
 provider_mode TEXT NOT NULL CHECK(provider_mode IN ('test','live')), method TEXT, checkout_url TEXT, verified_at TEXT, paid_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX transaction_enrollment ON transactions(enrollment_id,created_at);
CREATE UNIQUE INDEX one_pending_payment ON transactions(enrollment_id) WHERE status='pending';
CREATE TABLE webhook_events (id TEXT PRIMARY KEY, event TEXT NOT NULL, reference TEXT NOT NULL, processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE weeks (id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL CHECK(position>0));
CREATE TABLE modules (id TEXT PRIMARY KEY, week_id TEXT NOT NULL REFERENCES weeks(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL CHECK(position>0));
CREATE TABLE lessons (id TEXT PRIMARY KEY, module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', outcomes TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL CHECK(position>0), published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)));
CREATE TABLE lesson_progress (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,lesson_id));
CREATE TABLE resources (id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', url TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('documentation','notes','recording','download','tool')), position INTEGER NOT NULL DEFAULT 1);
CREATE TABLE assignments (id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT NOT NULL, due_at TEXT, position INTEGER NOT NULL DEFAULT 1);
CREATE TABLE submissions (id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, description TEXT NOT NULL, github_url TEXT, website_url TEXT, status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','reviewed','needs_revision','accepted')), feedback TEXT NOT NULL DEFAULT '', submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(assignment_id,user_id));
CREATE TABLE announcements (id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, title TEXT NOT NULL, content TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE live_sessions (id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, title TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, platform TEXT NOT NULL CHECK(platform IN ('Google Meet','Zoom')), meeting_url TEXT, notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled')));
CREATE TABLE site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE admin_audit_logs (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE auth_tokens (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, purpose TEXT NOT NULL CHECK(purpose IN ('login','unsubscribe')), expires_at INTEGER NOT NULL, consumed_at INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX tokens_email ON auth_tokens(email,purpose,expires_at);
CREATE TABLE auth_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX session_user ON auth_sessions(user_id);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, reset_at INTEGER NOT NULL);
CREATE TABLE email_outbox (id TEXT PRIMARY KEY, dedupe_key TEXT NOT NULL UNIQUE, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, recipient TEXT NOT NULL, subject TEXT NOT NULL, html TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')), attempts INTEGER NOT NULL DEFAULT 0, lease_until INTEGER, last_error TEXT, sent_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX outbox_status ON email_outbox(status,lease_until);
CREATE TABLE privacy_requests (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL CHECK(kind IN ('export','delete')), status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','fulfilled','declined')), notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX enrollment_course_status ON enrollments(course_id,status);
CREATE INDEX module_week_order ON modules(week_id,position);
CREATE INDEX lesson_module_order ON lessons(module_id,position);
CREATE INDEX week_course_order ON weeks(course_id,position);
CREATE INDEX session_course_start ON live_sessions(course_id,starts_at);
-- Settlement and the welcome outbox entry are one database transaction, even across duplicate callbacks.
CREATE TRIGGER payment_activated AFTER UPDATE OF status ON transactions WHEN NEW.status='success' AND OLD.status!='success'
BEGIN
 UPDATE enrollments SET status='active',activated_at=COALESCE(activated_at,CURRENT_TIMESTAMP) WHERE id=NEW.enrollment_id;
 INSERT OR IGNORE INTO email_outbox(id,dedupe_key,user_id,recipient,subject,html,kind)
 SELECT 'welcome-'||NEW.enrollment_id,'welcome-'||NEW.enrollment_id,u.id,u.email,'You are enrolled — Sanaa Academy',
 '<h1>Welcome to Sanaa Academy</h1><p>Your enrollment is confirmed.</p><p>Payment: KES '||(NEW.amount/100)||'. Reference: '||NEW.reference||'.</p><p>Open the academy website and choose Student portal to request a secure sign-in code. Class days and meeting details are available in your portal when scheduled.</p>', 'welcome'
 FROM enrollments e JOIN users u ON u.id=e.user_id WHERE e.id=NEW.enrollment_id;
END;
CREATE TRIGGER payment_revoked AFTER UPDATE OF status ON transactions WHEN NEW.status IN ('refunded','reversed') AND OLD.status='success'
BEGIN
 UPDATE enrollments SET status=NEW.status WHERE id=NEW.enrollment_id AND NOT EXISTS(SELECT 1 FROM transactions WHERE enrollment_id=NEW.enrollment_id AND status='success');
END;
