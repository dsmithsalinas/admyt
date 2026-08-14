# admyt

> Find where you fit.

admyt is an AI-powered college discovery product for high school students. Its core experience is a conversation with Sage, a warm and direct college guide that helps students explore schools around goals, affordability, location, and campus culture—not rankings alone.

## What is implemented

- Sage chat with persistent signed-in history and inline school cards
- Browse and filter for the College Scorecard catalog
- Profile-based Fit Scores with visible fit reasons
- School detail pages
- Vibe Check setup, streamed results, saved results, and comparisons
- Guest-first use with guest hearts and Vibe Checks stored on the device
- Email/password and Google authentication through Supabase
- Saved schools, preferences, application deadlines, and returning-user recap

Admit Odds and a dedicated side-by-side comparison workspace are not implemented. Sage can discuss and compare schools conversationally.

## Stack

- React 18, TypeScript, Vite 8
- Hand-written CSS in `src/styles`; no Tailwind or shadcn/ui
- Supabase Auth, Postgres, Row Level Security, and Edge Functions
- Anthropic Claude through `supabase/functions/chat`; the browser never calls Anthropic directly
- Vercel for the frontend
- Vitest, Playwright, and ESLint for verification

## Prerequisites

- Node.js 20.19 or newer
- npm
- Docker Desktop or Podman for the local Supabase stack
- A College Scorecard API key if you need to populate the full catalog
- An Anthropic API key for Sage and Vibe Check

## Local setup

```bash
npm ci
cp .env.example .env.local
cp supabase/.env.example supabase/.env.local
npx supabase start
```

Copy the local API URL and anon key printed by `supabase start` into `.env.local`, then run:

```bash
npx supabase functions serve chat --env-file supabase/.env.local
npm run dev
```

The migration chain creates every table, index, grant, function, and RLS policy. Verify it from a clean local database with:

```bash
npm run db:reset
```

### Populate colleges

Set `COLLEGE_SCORECARD_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, then run:

```bash
npm run data:colleges
```

The service-role key is only for this server-side import script. Never prefix it with `VITE_` or expose it to browser code.

## Environment variables

Frontend variables in `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local anon or publishable key>
VITE_APP_URL=http://localhost:5173
```

Edge-function secrets in `supabase/.env.local` locally, or Supabase Function Secrets in production:

```dotenv
ANTHROPIC_API_KEY=<secret>
ANTHROPIC_DAILY_REQUEST_LIMIT=100
```

Catalog-import-only variables in `.env.local`:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=<secret>
COLLEGE_SCORECARD_API_KEY=<secret>
```

## Verification

```bash
npm run check       # lint + unit tests + production build
npm run test:e2e    # Playwright browser tests
npm audit           # dependency advisories
```

Pull requests and pushes to `main` run the same checks in GitHub Actions.

See [`docs/OPERATIONS.md`](docs/OPERATIONS.md) for monitoring, AI cost controls, backups, and restore drills.

Public legal documents are routed at `/terms` and `/privacy`; the plain-language product disclosure is at `/data-and-privacy`. Update the effective date and contact through `src/lib/legal.ts` when policies change.

## Deployment

Preview database changes before applying them:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
npx supabase functions deploy chat
```

Set `ANTHROPIC_API_KEY` as a Supabase Function Secret. Set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel. Vercel deploys the frontend from `main`.

See [PRODUCTION_READINESS.md](./docs/PRODUCTION_READINESS.md) before a public launch.

## Project guidance

[CLAUDE.md](./CLAUDE.md) is the canonical product, architecture, voice, and design-system reference. Read it before changing product behavior or user-facing copy.

## License

MIT. See [LICENSE](./LICENSE).
