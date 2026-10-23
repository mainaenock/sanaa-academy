# Security model and maintenance

## Trust boundaries

- Public marketing responses expose program dates, safe website content and summary curriculum only. Private lessons, meeting links and learner records require an active enrollment at the server.
- Every private API operation resolves an opaque session cookie against a hashed D1 session record. Students are scoped by session user ID; supplied user IDs are ignored for student progress and submission writes. Administrative routes require a database `admin` role.
- Mutation endpoints require an exact configured Origin and a session-specific CSRF header, except login/unsubscribe (credential-bearing one-time flows) and Paystack webhooks (HMAC authenticated). Cookies use HttpOnly, SameSite=Lax, and production `__Host-` naming with Secure and Path=/.
- Account registration and password sign-in have D1-backed per-IP/per-email limits and Turnstile protection. Passwords use salted PBKDF2-HMAC-SHA-256; session IDs are random and stored hashed. No emailed login codes are used.
- Turnstile fails closed if not configured or if success/action/hostname checks fail. Siteverify is called only on the backend. Production cannot allow localhost widget hostnames.
- Input schemas limit field lengths and validate enums, HTTPS URLs, prices and dates. Plain-text lesson/announcement content is escaped by React. Email HTML escapes user-edited text. SQL values are bound; dynamic table/column names come only from a fixed application-owned allowlist.
- Public HTML has a restrictive CSP, frame restrictions, nosniff and referrer policy. Private pages and all APIs use no-store and noindex. No card or M-PESA credential data is stored.

## Financial invariants

Each checkout stores its own quote before initialization. KES amount, currency, transaction reference, provider mode, success status and enrollment metadata must match that quote. Redirects never activate enrollment. A signed webhook triggers server verification using the provider API; raw-body HMAC-SHA512 uses Web Crypto verification. D1 triggers activate/revoke enrollment and queue the original welcome message atomically with the payment state update. A unique pending-transaction index limits duplicate checkout creation; idempotent updates and outbox keys prevent duplicate activation/emails.

Verified test transactions are labelled and excluded from live revenue. Live mode requires a live secret key; production checkout rejects test configuration. Refunds require verified full-amount refund data. Partial refunds require documented operator reconciliation. Charge dispute resolution is not treated as a successful payment. Retained refunded/reversed transactions cannot be reactivated by replaying an old success event.

## Email safety

Outbox leases prevent simultaneous delivery attempts. Retry uses the same provider idempotency key; explicit resend creates a new message identity. Login email content is cleared after delivery and removed by credential cleanup. Payment settlement is durable even if email fails. Announcement recipients must be active and opted in, and unsubscribe tokens are hashed. Audit records track content changes, exports, feedback, sensitive privacy actions and reconciliation.

## Deployment responsibilities

Set actual operator support information, verified email sender, Paystack and Turnstile configuration, real database ID, HTTPS origin and initial admin. Enable MFA on Cloudflare, provider and administrator email accounts. Apply appropriate provider contracts, transfer safeguards and guardian verification process. Run a real test-mode provider checkout before live activation. Keep database backups and establish retention periods consistent with actual obligations.

Run `npm audit` periodically, review upstream vinext/Cloudflare releases, and rebuild/test before updating the compatibility date. Never run a forced downgrade suggested by npm audit without checking framework compatibility. Development build tooling is not a reason to run an unauthenticated development server on the public internet.

### Dependency audit on 17 October 2026

The current lockfile has **zero critical/moderate advisories and seven high-severity entries** in one transitive chain: `braces` → `micromatch` → `fast-glob` → `vite-plugin-dynamic-import` → `vite-plugin-commonjs` → `vinext` → `@vinext/cloudflare`. The underlying [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) concerns stack exhaustion from deeply nested glob patterns. The latest published braces release checked was 3.0.3, which remains affected. npm’s suggested fix downgrades the framework and is not applied blindly.

These packages process trusted source/build patterns, rather than learner-supplied inputs in this application. A scan of the generated server JavaScript found no braces/micromatch/fast-glob/commonjs-plugin references. This is a scoped exposure assessment, not a claim that the advisory is fixed. Keep builds isolated from untrusted repositories and track the upstream fix before treating the dependency audit as clean. The available fflate fix is applied through a tested override; deprecated test tooling and its critical advisories were removed.
