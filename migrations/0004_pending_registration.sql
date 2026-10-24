-- Keep the password unusable until payment settlement. This table is deleted
-- atomically with payment activation and is not readable by student APIs.
CREATE TABLE registration_secrets (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 password_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
