# NextReach marketing site

The public website for NextReach, a WhatsApp marketing SaaS for businesses in Pakistan.
Built with Next.js 16 (App Router, Cache Components), Tailwind CSS v4, shadcn/ui, Motion,
next-intl (English and Urdu, RTL) and Supabase.

> Full setup, Supabase and deployment docs arrive in the final phase. This covers local development.

## Requirements

- Node.js 22.12 or newer (`.nvmrc` pins 24, the current LTS)
- npm 10+

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in values; every variable is optional for local dev
npm run dev                  # http://localhost:3000 → redirects to /en
```

## Scripts

| Script                 | What it does                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run dev`          | Development server                                                    |
| `npm run build`        | Production build                                                      |
| `npm run start`        | Serve the production build                                            |
| `npm run lint`         | ESLint (zero warnings allowed)                                        |
| `npm run format`       | Prettier write (`format:check` to verify)                             |
| `npm run typecheck`    | Generate route types, then `tsc --noEmit`                             |
| `npm run test`         | Vitest unit tests                                                     |
| `npm run test:e2e`     | Playwright smoke tests against a production build (run `build` first) |
| `npm run check:bundle` | Fails if a server secret appears in the client bundle (after `build`) |
| `npm run ci`           | lint → format:check → typecheck → test → build → check:bundle         |

## Conventions

- **Copy** lives in `messages/en.json` and `messages/ur.json`. A unit test keeps the two in sync,
  and ESLint rejects literal strings in JSX.
- **RTL:** use logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`).
  ESLint rejects physical ones (`ml-`, `pr-`, `left-`, `text-right`, …).
- **Links:** import `Link` from `@/lib/i18n/navigation`, not `next/link`, so the locale prefix is kept.
- **Secrets:** server-only values are read through `@/lib/env/server` (guarded by `server-only`).
  Never commit `.env.local`.
