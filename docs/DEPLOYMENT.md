# Deployment and external-service activation

This is a Cloudflare Workers application, not a static export. Never publish `dist/client` alone: registration, authentication, payment verification, and private lessons require the Worker and D1. The official `create-vinext-app` Cloudflare target generated the Wrangler configuration. The supported legacy Wrangler option is intentional because this project requires a tracked Wrangler file and D1 migrations; no vinext compatibility blocker required OpenNext.

## 1. Local setup

Use Node 24 and npm. From the repository root:

```powershell
npm ci
npm run types
npm run db:migrate
Copy-Item .dev.vars.example .dev.vars
npm run dev -- --port 5173
```

Open `http://localhost:5173`. The public site and curriculum work after migrations. Configure the ignored `.dev.vars` for real sign-in and checkout. Paystack and Turnstile are required for checkout; Turnstile is required for sign-in. Resend is optional and only handles email delivery. Without the required providers, forms fail safely and do not fabricate payments or enrollments. There is no demo login or authentication bypass.

To preview the actual production bundle locally, stop the development server, run `npm run build`, then `npm start`. The launcher uses port 5173 by default and an absolute path to the same migrated `.wrangler/state` store. Use the exact `APP_URL` origin (`http://localhost:5173` by default) in your browser so mutation Origin checks match. `npm start -- --port 8787` can override the port; update your local `APP_URL` accordingly before testing forms. To run the read-only HTTP smoke suite against a running bundle, use `npm run smoke -- http://localhost:5173`.

Local dev uses D1 in `.wrangler/state/v3/d1`. Local migration never writes to a remote database. Test data lives in a separate, ephemeral workerd database; tests do not populate the preview database.

The standard Cloudflare tools use a profile registry/log directory. In a restricted environment, allow the runtime to use that directory or set `WRANGLER_LOG_PATH` to a writable local path. Do not disable application security to make development work.

## 2. Provider configuration

| Variable               | Location                              | Required value                                                                       |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| `DB`                   | Wrangler D1 binding                   | Real D1 database identifier in production                                            |
| `APP_URL`              | Wrangler vars                         | Exact browser origin, including port locally; HTTPS production origin                |
| `APP_ENV`              | Wrangler vars                         | `development` locally, `production` on the live Worker                               |
| `PAYSTACK_MODE`        | Wrangler vars                         | `test` or `live`; must match secret key prefix                                       |
| `PAYSTACK_SECRET_KEY`  | Worker secret                         | Paystack secret; never a public client variable                                      |
| `RESEND_API_KEY`       | Worker secret                         | Optional for checkout; required to deliver welcome and announcement emails          |
| `EMAIL_FROM`           | Worker secret                         | Optional for checkout; required with `RESEND_API_KEY` for outbound email             |
| `TURNSTILE_SITE_KEY`   | Worker secret or public configuration | Widget site key, returned publicly to render the widget                              |
| `TURNSTILE_SECRET_KEY` | Worker secret                         | Server-side Siteverify credential                                                    |
| `TURNSTILE_HOSTNAMES`  | Wrangler vars                         | Comma-separated exact frontend hostnames; no scheme/port; no localhost in production |

Paystack and Turnstile secrets plus `APP_URL` are required for enrollment and checkout. Resend and `EMAIL_FROM` are optional for checkout, but should be configured to deliver welcome and announcement emails. No secrets have been supplied or committed. `.dev.vars` and environment files are ignored. Never paste secrets into browser forms, prompts, source control, CI logs, or command-line arguments. Set production secrets with interactive standard input:

```powershell
npx wrangler secret put PAYSTACK_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
npx wrangler secret put TURNSTILE_SITE_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
```

These commands deploy secrets to the Worker specified by the source Wrangler configuration. Confirm the Cloudflare account and Worker before running them. Use separate D1 databases, Worker names, email configuration and provider keys for staging and production.

### Paystack

1. Activate your Kenyan Paystack business account and KES acceptance. Enable the channels available to your account; the application requests hosted `card` and `mobile_money` channels for supported M-PESA checkout.
2. Begin on a separate staging Worker with `PAYSTACK_MODE=test`, `APP_ENV=development`, a real HTTPS staging origin, and test keys. The production application rejects test-mode checkout.
3. Configure the webhook URL as `https://YOUR_ACTUAL_ORIGIN/api/webhooks/paystack`. Localhost cannot receive public webhooks; use staging for provider acceptance testing.
4. The callback points to `/payment`. The browser must have a verified account session. If a session expires, sign in and open `/payment` to reconcile the saved reference.
5. Test successful, declined, abandoned, pending, duplicate webhook, full refund, and mismatched-amount cases. Verify D1 state and portal access. The automated suite controls provider network responses; it does not replace an actual Paystack test-account checkout.
6. After acceptance, set live mode and the matching secret on the production Worker. Never test with a real charge without the payer’s explicit authorization.

Amounts are integer currency subunits: KES 8,000 is `800000`, KES 10,000 is `1000000`. Quote creation is server-side. References, amounts, currency, provider mode and enrollment metadata must all match before settlement. Raw webhook HMAC-SHA512 is checked before parsing. The verification API supplies the definitive transaction data. Full refunds are verified through the refund API; partial refunds deliberately require operator reconciliation. Transfer events do not alter enrollment.

If initialization times out, preserve and reconcile its saved reference before trying another payment. If a pending reference cannot be found at Paystack, contact the operator; never instruct the learner to pay again until the prior attempt is reconciled. Capacity includes pending reservations until they are reconciled and cancelled. Review abandoned reservations regularly.

### Email

1. Add and verify the sending domain in Resend. Apply the exact DNS records it supplies (including DKIM and any SPF/bounce records) and configure DMARC appropriately for your domain.
2. Choose the verified `EMAIL_FROM`. Test delivery to real controlled inboxes, including spam placement. Email is used for welcome/receipt and optional announcement messages, not sign-in codes.
3. Learners create an account with an email and password, complete their student profile, and pay through Paystack. Portal access is enabled only after payment verification. Returning learners use the same email and password.
4. Welcome/receipt emails use the durable outbox. Failed sends preserve enrollment. Retry from `/admin/emails`; students can request a fresh confirmation on `/payment` up to three times per day.
5. Announcement emails only target active, opted-in accounts. The admin explicitly queues batches of up to 20 and delivers up to three per action. Remaining messages stay in the outbox for operator delivery; this bounded approach avoids silently timing out bulk sends. Repeated queue actions deduplicate by announcement and user. Publish portal announcements for all enrolled students, including those who opt out of email.
6. Configure bounce/complaint handling in the provider account and suppress affected recipients. Account and payment emails are transactional; optional announcements include an unsubscribe link.

### Turnstile

Create a managed widget in your Cloudflare account for your actual frontend hostnames. Use the official development/test widget keys only in development, and real keys in production. The server validates `success`, hostname, and action (`login` or `register`) with canonical Siteverify. Tokens are single-use; the frontend resets its own widget after each submission attempt. Test successful verification, expired tokens, wrong actions, wrong hostnames, and replay rejection with actual tokens before launch. No widget/account credentials were created during implementation.

## 3. D1 and administrator bootstrap

Authenticate your Cloudflare account, inspect the account, then create the production D1 database:

```powershell
npx wrangler login
npx wrangler whoami
npx wrangler d1 create sanaa-academy
```

Replace the all-zero local placeholder in `wrangler.jsonc` with the returned database ID. Do not invent an ID. Before remote migrations, take a backup/export of an existing database and verify the target:

```powershell
npm run db:migrate:remote
npm run admin:create -- --email YOUR_REAL_ADMIN_EMAIL --remote
```

For local administration omit `--remote`. The script grants the role in D1 and records an audit entry; there is no default administrator. Sign in at `/login?next=/admin` using the configured email provider and Turnstile. Protect the admin mailbox with MFA and consider Cloudflare Access as an additional perimeter. Public self-registration never grants administrator roles.

The curriculum seed contains six weeks, six modules, twelve lessons, twelve practice assignments, and official resource links. It contains no learners, paid enrollments, revenue or invented instructor information. Apply migrations once using Wrangler’s migration history. Do not regenerate or edit applied migrations on a live database; add a new migration instead.

## 4. Build and deploy

Set the source Wrangler vars to your actual HTTPS origin, `APP_ENV=production`, `PAYSTACK_MODE=live`, and exact production Turnstile hostnames. Check that the provider secrets are present on the intended Worker. Set your support contact, instructor, policies, class timetable and registration availability in admin. Configure provider accounts before inviting payment.

The deploy command does not apply D1 migrations. Before deploying code that depends on a migration, check `wrangler d1 migrations list sanaa-academy --remote`, run `npm run db:migrate:remote` when migrations are pending, and confirm the list is clear.

```powershell
npm run types
npm run typecheck
npm run lint
npm test
npm run build
npx wrangler deploy --dry-run --config dist/server/wrangler.json
npm run deploy:check
npm run deploy
```

The deploy script guards against the local database placeholder, local hostnames, development environment and test payment mode. The build regenerates `dist/server/wrangler.json` from source. Do not edit generated configuration. After deployment, verify public routes, private-route redirects, cookies, no-store headers, bot validation, email delivery, provider callback/webhook, settlement and portal ownership. Enable logs/traces (already configured), restrict log access, and never log full provider payloads, secrets or login codes.

No Cloudflare account access, deployed URL, custom domain, test credentials, live payment, or verified email sender was provided during development. Those account-dependent steps remain activation requirements, not simulated completed work.

## 5. Domain, DNS, HTTPS and search

1. Purchase your chosen domain through a registrar and add it to Cloudflare. Use the actual nameservers supplied for your zone. Wait for the zone to activate.
2. Add the domain as a Worker Custom Domain in Cloudflare Workers settings, or add the supported custom-domain route in Wrangler. Let Cloudflare create the required DNS record; do not invent an origin IP. Remove conflicting DNS records only after verifying their purpose.
3. Confirm Universal SSL/certificate issuance, HTTPS, HTTP-to-HTTPS redirect, and your preferred host redirect. Set `APP_URL` to that canonical HTTPS origin, update Turnstile allowed hostnames and provider callback/webhook configuration, and rebuild/redeploy.
4. Verify public canonical metadata, the social image, `/robots.txt` and `/sitemap.xml`. Private routes have `noindex` headers and metadata plus `private, no-store` responses. Authentication and authorization remain the actual data boundary; robots directives are not security controls.
5. In Google Search Console, add a Domain property and publish the exact DNS TXT verification record Google supplies. Alternatively use a URL-prefix property with the verification method Google provides.
6. Submit your actual `https://YOUR_ORIGIN/sitemap.xml`. Inspect the homepage URL, test the live page, and request indexing when appropriate. Check the Page Indexing report and inspect affected URLs if they remain excluded. Sitemap submission and requests never guarantee indexing or ranking.
7. Do not request indexing of login, registration, callback, dashboard, API or lesson URLs. Keep private data out of public structured data.

## 6. Operations, retention and recovery

- Monitor failed emails, pending transactions, privacy requests and upcoming sessions from admin. Reconcile with Paystack before cancelling a reservation. Confirm full refunds in the provider; access revocation follows verified state.
- Review pending registrations after 30 days, and course learning records after 12 months. Reconcile outstanding transactions before privacy deletion. Use the audited privacy fulfillment action to remove personal learning/contact/guardian data and revoke sessions while pseudonymizing necessary financial references. Record the lawful reason and retention period for financial/audit records.
- Review role grants directly in D1 using controlled operator access. Do not expose a role-grant endpoint to public clients. Revoke sessions after a role change.
- Export/back up D1 before migrations and retain a tested restore process. Worker rollback does not roll back D1 or external payments. Keep the last known good build and audit migrations separately.
- Review the privacy/terms/refund text with the actual operator identity, contact and processing arrangements before launch; establish a process for guardian verification, consent withdrawal, complaints and data transfers under Kenya’s Data Protection Act. Configure exact benefits rather than promising recordings or certificates that have not been arranged.

## References checked during implementation

- [vinext and Cloudflare integration](https://github.com/cloudflare/vinext)
- [D1 bindings and atomic batches](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Paystack initialize and verify APIs](https://paystack.com/docs/api/transaction/)
- [Paystack webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack refunds](https://paystack.com/docs/api/refund/)
- [Resend idempotency](https://resend.com/changelog/idempotency-keys)
- [ODPC data-subject rights](https://www.odpc.go.ke/rights-of-a-data-subject/)
- [ODPC consent guidance](https://www.odpc.go.ke/wp-content/uploads/2024/02/ODPC-Guidance-Notes-on-Consent.pdf)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
