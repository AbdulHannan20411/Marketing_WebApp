# NextReach marketing site

The public website for **NextReach**, a WhatsApp marketing and sales SaaS for businesses in
Pakistan. It has:

- the marketing site (Home, Features, Pricing, Use cases, About, FAQ, Contact, legal pages) in
  **English and Urdu** (right to left);
- a guided **query form** (contact page and dialog) with spam protection, attachments and emails;
- a **customer portal** (`/account`) where people follow their queries and reply;
- a **Super Admin area** (`/admin`): dashboard, live inbox, replies, notes, saved replies,
  customers and settings.

The NextReach product itself is a separate app. Every "Start free trial" and "Sign in" link goes to
`NEXT_PUBLIC_APP_URL`; this site never handles app accounts.

**Stack:** Next.js 16 (App Router, Cache Components, Server Actions), React 19, TypeScript (strict),
Tailwind CSS v4 + shadcn/ui, Motion, next-intl, Supabase (Auth, Postgres + RLS, Storage, Realtime),
Zod + React Hook Form, Resend, Vitest and Playwright.

---

## Contents

1. [Run it locally](#1-run-it-locally)
2. [Environment variables](#2-environment-variables)
3. [Supabase setup](#3-supabase-setup)
4. [Make yourself a Super Admin](#4-make-yourself-a-super-admin)
5. [Email, spam protection and analytics](#5-email-spam-protection-and-analytics)
6. [Live pricing](#6-live-pricing)
7. [Deploy to Vercel](#7-deploy-to-vercel)
8. [Scripts](#8-scripts)
9. [Testing and quality checks](#9-testing-and-quality-checks)
10. [Project structure and conventions](#10-project-structure-and-conventions)
11. [Security notes](#11-security-notes)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Run it locally

Requirements: **Node.js 22.12 or newer** (`.nvmrc` pins 24, the current LTS) and npm 10+.

```bash
npm install
cp .env.example .env.local     # fill in what you have; see section 2
npm run dev                    # http://localhost:3000 → redirects to /en
```

Every variable is optional for browsing the marketing pages. Without Supabase, the query form,
sign-in, the portal and the admin area show a friendly error. Without the pricing API, Pricing
shows the fallback plans with a "prices may have changed" note.

## 2. Environment variables

Put real values in `.env.local` (never committed). `.env.example` lists every variable with a
placeholder. On Vercel, set the same names under **Project → Settings → Environment Variables**.

| Variable                        | Required            | Where it's used                                                                                                             |
| ------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | Production          | This site's public URL, e.g. `https://nextreach.pk`. Canonical URLs, sitemap, Open Graph images and email links.            |
| `NEXT_PUBLIC_APP_URL`           | Production          | The NextReach app. All "Start free trial" / "Sign in" links. Pricing CTAs go to `${APP_URL}/pricing` and `/pricing/custom`. |
| `NEXTREACH_API_URL`             | For live prices     | Base URL of the NextReach API (`/api/v1/public/plans`, `/api/v1/public/custom-plan`). Server only.                          |
| `REVALIDATE_SECRET`             | For instant updates | Shared secret for `POST /api/revalidate-pricing` (section 6). Use a long random string.                                     |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes, for accounts   | Supabase project URL.                                                                                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes, for accounts   | Supabase **publishable** (anon) key. Safe in the browser; Row Level Security protects the data.                             |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes, for accounts   | Supabase **secret** (service role) key. **Server only.** Also keys the form tokens and IP hashing.                          |
| `SUPABASE_DB_URL`               | Scripts only        | Postgres connection string for migrations, types and DB tests. Never read by the app.                                       |
| `RESEND_API_KEY`                | For real email      | Resend API key. Without it, emails are printed to the server log instead.                                                   |
| `EMAIL_FROM`                    | With Resend         | Sender, e.g. `NextReach <hello@nextreach.pk>`. The domain must be verified in Resend.                                       |
| `TURNSTILE_SITE_KEY`            | Optional            | Cloudflare Turnstile site key. Turnstile is on only when **both** Turnstile keys are set.                                   |
| `TURNSTILE_SECRET_KEY`          | Optional            | Cloudflare Turnstile secret key. Server only.                                                                               |
| `NEXT_PUBLIC_ANALYTICS_ID`      | Optional            | Umami Cloud **website ID**. Leave empty to disable analytics and the consent notice.                                        |

`npm run check:bundle` (part of `npm run ci`) fails the build if any server-only name or value
appears in the browser bundle.

## 3. Supabase setup

### 3.1 Create the project and add the keys

1. Create a project at [supabase.com](https://supabase.com). Pick a region close to your users
   and your Vercel functions.
2. **Project Settings → API keys:** copy the project URL, the **publishable** key
   (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) and the **secret** key (`SUPABASE_SERVICE_ROLE_KEY`).
3. **Connect → Session pooler:** copy the connection string into `SUPABASE_DB_URL`.
   URL-encode special characters in the password (for example `@` → `%40`).

### 3.2 Create the database

```bash
npm run db:push     # applies supabase/migrations (tables, RLS, triggers, storage, realtime)
npm run db:seed     # optional: starter saved replies in English and Urdu
npm run test:db     # optional: proves the RLS rules and triggers work on your project
```

The migrations create:

- **Tables:** `profiles`, `queries` (with `NR-YYYY-#####` references from a sequence),
  `query_messages`, `query_attachments`, `query_events` (activity log), `saved_replies`,
  `admin_settings` and `rate_limits`. Every table has Row Level Security with explicit policies.
- **Storage:** the private `query-attachments` bucket. Files are only reachable through
  60-second signed URLs created after an ownership check.
- **Realtime:** `queries` and `query_messages` are published, so the portal and inbox update live.

### 3.3 Dashboard settings

These can't be set from migrations. In **Authentication**:

| Setting                                 | Value                                                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| URL Configuration → **Site URL**        | Your site, e.g. `https://nextreach.pk` (locally `http://localhost:3000`).                                                       |
| URL Configuration → **Redirect URLs**   | `https://nextreach.pk/**` and `http://localhost:3000/**` (add preview domains if you use them, e.g. `https://*.vercel.app/**`). |
| Sign In / Providers → Email             | Email provider on, **Confirm email** on.                                                                                        |
| Sign In / Providers → Email → Password  | Minimum length **8**.                                                                                                           |
| Emails → Templates → **Confirm signup** | Paste `supabase/templates/confirm-signup.html`. Subject: `Confirm your email \| NextReach`.                                     |
| Emails → Templates → **Reset password** | Paste `supabase/templates/reset-password.html`. Subject: `Reset your password \| NextReach`.                                    |
| Emails → **SMTP settings**              | Recommended: use Resend's SMTP (`smtp.resend.com`, port 465, user `resend`, password = your Resend API key).                    |

The templates switch between English and Urdu using the language chosen at sign-up. They link to
`/[locale]/auth/confirm` with a `token_hash`, which works on any device. Supabase's built-in email
service is heavily rate-limited, so set up SMTP before launch.

### 3.4 After changing the schema

Add a new file to `supabase/migrations/`, then run `npm run db:push` and `npm run db:types`
(this regenerates `lib/supabase/database.types.ts`). Keep `npm run test:db` passing.

## 4. Make yourself a Super Admin

The role can never be set from the browser. Sign up on the site, confirm your email, then:

```bash
npm run make-superadmin -- you@example.com
```

Or in the Supabase SQL editor:

```sql
select public.promote_to_superadmin('you@example.com');
```

Sign out and back in, then open `/en/admin`. Anyone who isn't an active Super Admin gets a 404 there.

## 5. Email, spam protection and analytics

**Email (Resend).** Set `RESEND_API_KEY` and `EMAIL_FROM` (on a domain verified in Resend). The site
sends:

- new-query alerts to every Super Admin, plus the extra addresses in **Admin → Settings**;
- an acknowledgement to the sender, using the text from **Admin → Settings**;
- the team's replies to the customer;
- customer replies to the team.

Each email has HTML and plain-text versions in the recipient's language. Without a key, emails are
logged to the server console.

**Spam protection.** Every submission passes these checks:

- a hidden honeypot field;
- a signed form token with a minimum time-to-submit (3 seconds);
- a rate limit of 5 queries per hour per IP and per email (Postgres);
- attachment checks: type from the file's content and size on the server (PNG, JPG or PDF up to 5 MB);
- optional Cloudflare Turnstile when both Turnstile keys are set.

**Analytics (optional).** Set `NEXT_PUBLIC_ANALYTICS_ID` to your **Umami Cloud** website ID. Visitors
then see a short notice, and the Umami script loads only after they accept. Their choice is stored
in the browser, and a "Cookie settings" link in the footer lets them change it. With the variable
empty, nothing loads and no notice is shown. The CSP allows Umami's domains only when analytics is
on.

## 6. Live pricing

Pricing reads `GET ${NEXTREACH_API_URL}/api/v1/public/plans` and `/api/v1/public/custom-plan`.
Responses are wrapped as `{ data, message, traceId }` and validated with Zod.

- **Caching:** prices are cached for 10 minutes.
- **API failures:** if the API is down or returns something unexpected, the page shows the typed
  fallback plans in `content/fallback-plans.ts`, with a "Prices may have changed" note. The page
  never crashes.
- **Instant updates:** to refresh prices right after you change them in the app, call:

```bash
curl -X POST https://nextreach.pk/api/revalidate-pricing -H "x-revalidate-secret: $REVALIDATE_SECRET"
```

## 7. Deploy to Vercel

1. **Import** the repository in Vercel. It detects Next.js; keep the default build command
   (`next build`) and output settings.
2. **Node.js version:** Project → Settings → General → Node.js Version → **22.x or newer**.
3. **Environment variables:** add everything from section 2. Mark `SUPABASE_SERVICE_ROLE_KEY`,
   `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` and `REVALIDATE_SECRET` as **Sensitive**. Set
   `NEXT_PUBLIC_SITE_URL` to the production domain (for previews you can leave the default).
4. **Function region:** Project → Settings → Functions → choose the region closest to your
   Supabase project (for example `syd1` for Supabase in `ap-southeast-2`). Database calls then stay
   short.
5. **Domain:** add your domain under Settings → Domains.
6. **After the first deploy:**
   - set the Supabase **Site URL** and **Redirect URLs** to the production domain (section 3.3);
   - run `npm run make-superadmin -- you@example.com` locally against the production project;
   - send yourself a test query from `/en/contact`, then reply to it from `/en/admin`.

The site sends security headers on every response: CSP, HSTS (2 years, preload-ready),
`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` / `frame-ancestors 'none'`,
COOP and `Permissions-Policy`. Before submitting the domain to the HSTS preload list, make sure
every subdomain serves HTTPS.

## 8. Scripts

| Script                               | What it does                                                               |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `npm run dev`                        | Development server                                                         |
| `npm run build` / `npm run start`    | Production build / serve it                                                |
| `npm run lint`                       | ESLint (zero warnings allowed)                                             |
| `npm run format`                     | Prettier write (`format:check` to verify)                                  |
| `npm run typecheck`                  | Generate route types, then `tsc --noEmit`                                  |
| `npm run test`                       | Vitest unit tests                                                          |
| `npm run test:db`                    | RLS, grant and trigger tests against `SUPABASE_DB_URL` (rolled back)       |
| `npm run test:e2e`                   | Playwright end-to-end tests against a production build                     |
| `npm run lighthouse`                 | Lighthouse (mobile) on Home, Pricing and Contact, with the brief's targets |
| `npm run check:bundle`               | Fails if a server secret appears in the client bundle (after `build`)      |
| `npm run ci`                         | lint → format:check → typecheck → test → build → check:bundle              |
| `npm run db:push`                    | Apply pending migrations (`-- --dry-run` to preview)                       |
| `npm run db:seed`                    | Insert starter saved replies (safe to rerun)                               |
| `npm run db:types`                   | Regenerate `lib/supabase/database.types.ts`                                |
| `npm run make-superadmin -- <email>` | Promote a signed-up account to Super Admin                                 |

## 9. Testing and quality checks

**Unit tests** (`tests/unit`, Vitest) cover:

- the pricing API client and view models;
- validation schemas, filters and route guards;
- security headers, the sitemap, robots.txt and JSON-LD;
- consent handling;
- that the English and Urdu message files have matching keys and placeholders.

**Database tests** (`tests/db`, `npm run test:db`) impersonate visitors, customers and Super Admins
to prove the RLS rules, grants, triggers, rate limiting and dashboard stats. Each test runs in a
transaction that is rolled back.

**End-to-end tests** (`tests/e2e`, Playwright) run against `next start` on port 3100 and a local
mock pricing API (port 3999), at desktop size and at 360 px (mobile):

| Spec                                                                 | Covers                                                                                                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `smoke.spec.ts`                                                      | The full journey: send a query signed out → sign up with that email and see it linked → a Super Admin replies → the customer sees it → Urdu RTL. |
| `a11y.spec.ts`                                                       | axe-core WCAG 2.2 A/AA checks on every public page in both languages and both themes, plus the portal and admin pages.                           |
| `marketing.spec.ts`, `foundation.spec.ts`                            | Pages, headers, no horizontal scroll at 360 px, theme, language switching, 404s, menus.                                                          |
| `pricing-api.spec.ts`                                                | Live plans, fallback when the API is down, revalidation and JSON-LD (switches the mock API between modes).                                       |
| `queries.spec.ts`, `auth.spec.ts`, `portal.spec.ts`, `admin.spec.ts` | The query form, accounts, portal and admin area in depth.                                                                                        |

Specs that need Supabase create their own test users through the admin API and delete everything
afterwards. They are skipped when Supabase isn't configured. Run with:

```bash
npm run build && npm run test:e2e
```

**Lighthouse.** `npm run build && npm run lighthouse` audits Home, Pricing and Contact as a mobile
device. It runs each page three times and checks the median against the targets: Performance ≥ 90,
Accessibility ≥ 95, Best Practices ≥ 95 and SEO ≥ 95. Reports are saved to `lighthouse-reports/`.
Options:

- `LIGHTHOUSE_PAGES=/ur,/en/faq` audits other pages;
- `LIGHTHOUSE_URL=https://…` audits a deployed site;
- `LIGHTHOUSE_RUNS=5` changes the number of runs.

Lighthouse varies with machine load, so compare medians, not single runs.

## 10. Project structure and conventions

```
app/[locale]/(marketing)   public pages (+ opengraph-image.tsx per page)
app/[locale]/(auth)        sign-in, sign-up, forgot/reset password, email confirm, sign-out
app/[locale]/account       customer portal
app/[locale]/admin         Super Admin area
app/api/                   revalidate-pricing
app/sitemap.ts, robots.ts  sitemap.xml and robots.txt
components/                UI primitives, layout, marketing sections, motion, analytics
features/                  queries (form, actions, emails), auth, portal, admin
lib/                       Supabase clients, API client, i18n, SEO, OG images, security, env
content/                   typed feature, FAQ, use-case and fallback-plan content
messages/en.json, ur.json  all copy
supabase/                  migrations, seed, email templates
tests/                     unit, db and e2e tests
```

- **Copy** lives only in `messages/en.json` and `messages/ur.json`. A test keeps them in sync, and
  ESLint rejects literal strings in JSX.
- **RTL:** use logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`).
  ESLint rejects physical ones (`ml-`, `pr-`, `left-`, `text-right`, …).
- **Links:** import `Link` from `@/lib/i18n/navigation` (keeps the locale), not `next/link`.
- **Zod:** import `z` from `@/lib/validation/zod`. It is configured `jitless` so it never probes
  `eval`, which the CSP blocks. ESLint enforces this.
- **Secrets:** server-only values come from `@/lib/env/server` (guarded by `server-only`). Never
  commit `.env.local`.
- **SEO:** use `pageMetadata()` from `lib/seo.ts` for new pages. It sets the canonical URL and
  hreflang. Add the path to `publicPaths` for the sitemap, and add an `opengraph-image.tsx` beside
  the page. Urdu text in OG images is shaped with HarfBuzz (`lib/og/shaped-text.ts`).
- **Placeholders:** no fake statistics, testimonials or logos. Look for `TODO:` comments where real
  content belongs (testimonials, customer logos, legal review, social profiles in JSON-LD).

## 11. Security notes

- **Roles are checked three times:** in layouts, in every Server Action and in Postgres RLS. The
  proxy also redirects signed-out visitors away from `/account` and `/admin`.
- **The service-role key is server-only.** It is used only after the server's own checks (for
  example, inserting a visitor's query or creating signed URLs).
- **Every input is validated on the server with Zod.** Users see generic errors; details go to
  the server logs.
- **The CSP is static** (no nonces), so pages stay statically prerendered. That means
  `'unsafe-inline'` scripts are allowed. Everything else is locked down, including no eval,
  no framing and no foreign form targets.

## 12. Troubleshooting

| Problem                                 | Fix                                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Confirmation link says the link expired | The redirect URL isn't allowed: add your domain to Supabase **Redirect URLs** (section 3.3).                           |
| No emails arrive                        | Check `RESEND_API_KEY` / `EMAIL_FROM` and the Resend domain. Without them, look for `[email]` lines in the server log. |
| `/admin` shows "page not found"         | Your account isn't a Super Admin yet (section 4), or it is suspended.                                                  |
| The inbox or portal doesn't update live | Realtime is published by the migrations; check the browser can reach `wss://<project>.supabase.co` (CSP and network).  |
| Pricing shows "Prices may have changed" | `NEXTREACH_API_URL` is missing or the API returned an error; see `[nextreach-api]` lines in the server log.            |
| `npm run db:push` can't connect         | Use the **Session pooler** string and URL-encode the password.                                                         |
