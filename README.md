# Sanaa Academy

A database-powered, mobile-first academy built with the Next.js App Router API on **vinext**, React, TypeScript, Tailwind, Cloudflare Workers and D1. It includes the marketing website, verified Paystack enrollment, passwordless accounts, a student portal, and an administration dashboard.

## Run locally

```powershell
npm ci
npm run types
npm run db:migrate
Copy-Item .dev.vars.example .dev.vars
npm run dev -- --port 5173
```

Open `http://localhost:5173`. The public website works with the seeded local database. Add your provider configuration to the ignored `.dev.vars` to enable email sign-in, Turnstile and Paystack test checkout. There are no demo credentials, fabricated payments, or client-only database substitutes.

## Administrator setup

```powershell
npm run admin:create -- --email YOUR_ADMIN_EMAIL
```

Sign in at `/login?next=/admin` with that email. The role is granted in local D1 and mailbox ownership is verified through a one-time code. To bootstrap production, configure the real D1 binding and explicitly append `--remote` to the command. No permanent password is sent or stored.

## What is implemented

- Server-rendered public website with six-week curriculum, time-aware pricing, editable FAQs/instructor/benefits/branding, accessible navigation, reduced-motion support and responsive layouts.
- Verified email enrollment, guardian-controlled minor consent, server-priced KES Paystack hosted checkout, saved registration recovery and payment confirmation.
- Transaction verification, signed raw-body webhooks, duplicate protection, atomic enrollment/outbox settlement, failure recovery and refund/reversal handling.
- Student curriculum and lesson content, completion tracking, private class sessions, resources, assignments, project submissions, feedback, profile and privacy controls.
- Role-protected admin views, learner search/filter/export, progress corrections, curriculum CRUD/order, schedule management, website/program settings, payment reconciliation, announcements, email outbox and audit logs.
- SQL migrations and content seeds, generated Worker binding types, security headers, CSRF/origin checks, persistent rate limits, secure sessions and validation.
- Real D1/workerd integration tests, CI checks, deployment configuration and operator documentation.

The initial program is **9 November–18 December 2026**, six weeks in `Africa/Nairobi`. The full early fee is **KES 8,000** through **1 November 2026, 23:59:59.999 EAT**; the regular full fee is **KES 10,000** afterward. All program settings are editable in admin. Meeting times, links, instructor identity, contacts and optional benefits must be configured with actual information.

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run db:migrate
npm run build
```

Tests exercise real D1 SQL, constraints and triggers inside workerd. Provider network responses are controlled in tests. Actual Paystack test-account checkout, email delivery and real Turnstile token acceptance must be verified using your configured external accounts before production activation.

## Project structure

```text
app/
  page.tsx                         Public marketing website
  layout.tsx, globals.css           Shared metadata and responsive design system
  register/, login/, payment/       Enrollment, authentication and confirmation
  portal/[[...section]]/            Protected student routes
  admin/[[...section]]/             Protected admin routes
  api/[...path]/                    Worker-compatible route-handler adapter
  policies/[policy]/               Privacy, terms and refund policies
  unsubscribe/                     Optional-email preferences
  robots.ts, sitemap.ts            Public search discovery
components/
  brand.tsx, public-shell.tsx       Shared public layout
  build-scene.tsx, countdown.tsx    Lightweight public visual interactions
  login-form.tsx, turnstile.tsx     Email verification and bot protection
  register-form.tsx                 Guardian-aware enrollment form
  payment-status.tsx                Server-verified payment recovery
  workspace-shell.tsx               Responsive private navigation
  student-app.tsx                   Learning, projects, profile and privacy
  admin-app.tsx, admin-editor.tsx    Management views and validated editors
  client-api.ts                    Typed browser API helper
lib/
  api.ts, http.ts                   Routing, origin checks, errors and rate limits
  db.ts, defaults.ts                D1 access and initial public content
  auth.ts, crypto.ts                One-time codes, sessions and Web Crypto
  payments.ts, email.ts             Paystack lifecycle and durable email delivery
  student.ts                       Enrolled learner operations
  admin.ts, admin-model.ts          Authorized management, validation and auditing
  domain.ts, view-types.ts          Shared business rules and data contracts
migrations/
  0001_schema.sql                  Tables, constraints, indexes and settlement triggers
  0002_curriculum.sql              Real course content; no fake business records
scripts/
  start-worker.mjs                 Built preview sharing the migrated local D1 store
  smoke.mjs                        Built-Worker route and security smoke checks
  create-admin.mjs                 Audited operator-only admin bootstrap
  preflight.mjs                    Production configuration guard
  generate-seed.mjs                Initial seed source, not for reapplying live seeds
  generate-social-image.mjs         Optional static social-image regeneration
tests/                             Domain and workerd/D1 integration tests
docs/                              Deployment, security and implementation records
public/                            Social sharing image and brand assets
.github/workflows/checks.yml       Repeatable CI validation
wrangler.jsonc, vite.config.ts     Cloudflare runtime and build configuration
.dev.vars.example                 Environment variable checklist
```

## Deployment and remaining activation

Read [the full deployment guide](docs/DEPLOYMENT.md) for the environment checklist, D1 migrations, production build/deploy, secret configuration, admin bootstrap, domain/DNS/HTTPS, Paystack webhooks, Resend sender verification, Turnstile and Google Search Console. See [the security model](docs/SECURITY.md) and [implementation record](docs/IMPLEMENTATION.md).

Deployment needs your Cloudflare account and real D1 ID, chosen HTTPS domain, verified email sender, Paystack account/keys and webhook, Turnstile widget, administrator email, support contact and final timetable. No domain, meeting link, credential or instructor identity is invented. Production checkout rejects development/test configuration.
