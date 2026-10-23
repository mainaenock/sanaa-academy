# Sanaa Academy implementation record

The source brief is the goal-objective.md supplied on 17 October 2026. Brand spelling is **Sanaa Academy**.

## Architecture

- Next.js App Router API on vinext, React, TypeScript and Tailwind, running inside Cloudflare workerd.
- D1 is the source of truth for users, sessions, enrollment, verified transactions, curriculum, progress, submissions, content and audit logs.
- Salted PBKDF2 password authentication, opaque hashed session cookies, strict origin checks, expiring sessions and persistent rate limits.
- Paystack hosted checkout; amount and KES currency checked against a stored server-side quote. Signed raw-body webhooks and server verification share atomic, idempotent settlement.
- Resend HTTP delivery with a durable email outbox. Payment settlement never depends on email delivery. No fake production data or development authentication bypass.
- Guardian consent collected for under-18 learners; payer can be a guardian. Public curriculum excludes private lesson content and meeting URLs.
- A metadata-driven administration editor provides validated CRUD and auditing. Private data is protected at API and page boundaries.

## Phases

1. Architecture, routing, shared theme, dependencies and Cloudflare setup.
2. Public website, curriculum, enrollment interface, responsive animation.
3. Schema, seeds, authentication, enrollment, Paystack, email.
4. Student curriculum, progress, live sessions, resources, submissions and profile.
5. Administration, security, tests and deployment/operator documentation.

Each phase is verified against type checking and build compatibility as implementation progresses. External-account activation is documented separately from local verification.

## Delivered phase outcomes

1. **Foundation:** official Cloudflare vinext App Router starter, TypeScript/Tailwind, generated binding types, responsive reusable public/private shells, theme tokens and route boundaries. The source uses the supported Wrangler setup selected by the official starter.
2. **Public website:** a compact, server-rendered academy homepage with a hero, program choices/current curriculum, and time-aware pricing. Web development is available now; web apps/software and mobile apps are marked coming soon. Editable FAQs have their own `/faq` page. A Kenya-colored open-book/graduation-cap logo, SVG/PNG exports, updated sharing artwork, editable branding, student registration and password sign-in UI, guardian consent, responsive CSS, reduced-motion support, canonical/OG/Twitter metadata, Course structured data, policies, robots and sitemap are included. AI sparkle icons have been removed throughout the public site and student portal.
3. **Data and enrollment:** D1 migrations/seed, salted password hashes, hashed expiring sessions, student registration, server-priced Paystack checkout, saved enrollment/payment recovery, API verification, signed/deduplicated webhooks, atomic settlement/outbox triggers, verified refund association and email failure recovery.
4. **Learning portal:** authenticated enrollment gating, ordered modules/lessons, lesson completion, current-week calculations in the configured timezone, private live sessions, resource links, assignment submissions/feedback, profile changes, optional-email preferences, personal data export and deletion requests.
5. **Administration and operations:** role checks, metrics from stored verified records, search/filter/CSV, learner/payment/progress review, curriculum/content CRUD, program/website configuration, session management, consent-aware announcements, recoverable email outbox, audited sensitive actions, privacy fulfillment, CI and deployment/account-activation documentation.

## Verification record — 17 October 2026

### Homepage design revision — 19 October 2026

The user-supplied Stitch HTML now guides the homepage: light centered hero with a reduced-motion-aware typewriter, locally hosted Plus Jakarta Sans and portrait, faculty/editorial composition, six curriculum milestones, future-program labels, and a light pricing card with live timer tiles. A follow-up request also restyled the shared navigation and footer to match, preserving their exact existing content and destinations. Faculty fields are editable again. Design provenance and intentionally excluded reference claims are documented in `design-reference/README.md`.

The revised source passed TypeScript checking and a production build. The local Worker passed all 13 route smoke checks. Browser checks covered desktop (1280px), tablet (768px), and mobile (390px and 320px), with no horizontal overflow. The mobile menu, curriculum/pricing links, and registration CTA were exercised. The existing user-owned preview at port 5174 was retained.

### Initial application verification

- Type checking and lint passed on the final application source.
- **27 automated tests passed** in workerd with real isolated D1 at the time of initial verification. That historical suite covered validation, pricing, settlement, enrollment gating, ownership, CSRF/origin rejection, submissions, email-code authentication and payment-to-portal behavior; password authentication was added afterward.
- Both SQL migrations applied successfully to local D1. Seeds contain only course configuration/content and official learning links.
- Production builds and Cloudflare deployment dry runs passed. Build output includes the Worker, SSR/client bundles and D1 binding. Nonfatal upstream sourcemap/deprecation and route-classification messages remain; they do not constitute deployment.
- HTTP verification of the development Worker confirmed the rendered homepage, expected KES 8,000 public quote, provider readiness false without credentials, CSP and no-store headers.
- The built Worker passed **13 HTTP smoke checks** for actual rendered course content, the separate FAQ page, registration/policies, CSS assets, robots/sitemap, pricing JSON, anonymous private-API rejection, private-page redirects and not-found behavior, including no-store/noindex headers. A separate local persistence directory in Wrangler’s generated-config preview was detected and corrected with an explicit shared-state launcher.
- The PNG sharing image and logo exports were generated and visually inspected. The revised homepage was inspected in the browser at desktop, tablet, and mobile widths; the mobile navigation, curriculum expansion, and separate FAQ answers were exercised. Mobile and tablet checks found no horizontal overflow. Full authenticated/payment browser acceptance still requires configured providers.
- No remote database changes, deployed domain, real payment, external email delivery or real Turnstile token flow was performed without the corresponding account configuration. Provider boundary responses are controlled in automated tests. Follow the deployment guide for actual staging acceptance before enabling live registration.
- The remaining seven high-severity npm audit entries belong to one unpatched build-glob dependency chain. See `SECURITY.md` for the affected packages, scope assessment and maintenance requirement.

The deployment preflight reads JSONC, rejects the local database placeholder and development/live-mode mismatch, and requires a real HTTPS origin with matching production Turnstile hostnames.
