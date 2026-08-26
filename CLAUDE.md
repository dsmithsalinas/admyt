# Admyt — Claude Code Project Context

## What is Admyt?
Admyt is an AI-powered college search platform for high school students. The core thesis: fit matters more than rankings. The college search process is broken — built around stats and prestige that tell you nothing about whether you'll actually be happy there. Admyt exists to change that.

The product is built around a conversational AI advisor named **Sage**. Students talk to Sage to discover schools that match their goals, personality, and vibe — not just their GPA.

## The name
**Admyt** — pronounced "admit." Coined spelling, AI-native feel. Always written lowercase. The `y` is the brand accent — indigo (#818CF8) on dark, brand indigo (#6366F1) on light.

## Sage — the AI advisor
- **Name:** Sage
- **Personality:** Warm, direct, concise. Like a knowledgeable older sibling — not a guidance counselor. Honest, never condescending, no jargon. Has opinions and shares them when asked.
- **Avatar:** Lowercase "s" in a circle — indigo (#6366F1) fill on light lavender (#EEF2FF) background, with a vibe pink (#F0ABFC) dot accent. SVG in `src/components/sage/SageAvatar.tsx`.
- **Role:** Sage IS the core experience. The home page is a persistent conversation with Sage. Onboarding flows naturally into the conversation — no separate page.

## Key features
- **Sage chat** — persistent AI conversation, the primary UI. Surfaces inline school cards with match scores, stats, heart button.
- **School Match** — AI-generated match scores based on student profile (location prefs, career goals, intended major)
- **Vibe Check** — social/culture fit analysis across 9 dimensions (social scene, athletics, arts, political culture, Greek life, diversity, outdoor access, academic intensity, local community). Student selects which dimensions matter to them, Sage generates scores + summary.
- **Browse/Search** — filter 1,000 real colleges by state, size, type, tuition, major
- **Profile** — four sections: What Sage knows, My schools (hearted), Vibe Checks (saved), My preferences

## The Admyt story (brand narrative)
The college search process is broken. Built around rankings, stats, and prestige — metrics that tell you nothing about whether you'll actually be happy there. Students spend months researching schools they'll never visit, filling out applications for places they don't understand, making one of the biggest decisions of their lives based on a US News ranking and a campus tour brochure.

Admyt exists because fit matters more than rank. The right school for you is the one where you'll actually show up, plug in, and become who you're supposed to become. That's where Sage comes in. And that's why Vibe Check isn't a feature — it's the thesis.

## Tech stack
- **Frontend:** React + Vite + TypeScript
- **Styling:** Bespoke hand-written CSS design system — `src/styles/global.css` (native CSS `@layer` blocks + component classes like `.app-frame`, `.pill`, `.btn`, `.school-card`, `.mock-card`) and `src/styles/tokens.css` (design tokens / CSS custom properties), plus inline React `style` props. **Not Tailwind** — Tailwind and shadcn/ui were removed during the redesign (see Design system below). Icons via `lucide-react`.
- **Backend:** Supabase (auth, database, edge functions)
- **AI:** Anthropic Claude API (model: claude-sonnet-4-6)
- **API proxy:** Supabase Edge Function at `supabase/functions/chat/index.ts` — all Claude API calls go through here, never directly from the browser
- **Deployment:** Vercel — live at `youradmyt.com` (`youradmyt.vercel.app` remains the Vercel fallback), auto-deploys on every push to `main` (Vercel GitHub integration). Per-deploy/preview URLs are gated by Vercel Deployment Protection; the production domain is public. Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars set in the Vercel project.
- **Auth email:** Passwordless six-digit sign-in codes are delivered through Supabase Auth using Resend custom SMTP. `youradmyt.com` is verified in Resend; production sends from `Sage from admyt <sign-in@youradmyt.com>`. The canonical template is `supabase/templates/sign-in-code.html` and must stay synchronized with the hosted Supabase Magic Link / OTP template.
- **Admin + application email:** The authenticated `/admin` overview reports the rolling Sage AI budget, College Scorecard freshness, and scheduled email-worker health. Linked modules provide email operations, deadline-quality preview/review/accept remediation, exact-email user support, incident controls plus a public maintenance notice, and a 365-day privacy-minimized audit trail. Every admin route uses the server-side `EMAIL_OPERATIONS_ADMIN_EMAILS` allowlist enforced by the `email-operations` Edge Function; frontend routing is not an authorization boundary. `supabase/functions/welcome-email` sends one deduplicated, transactional welcome after a new account successfully signs in. The opt-in reminder pipeline lives in `supabase/functions/deadline-reminders`; Supabase Cron invokes it daily at 15:00 UTC and sends at 30 and 7 days only for recently checked official-source dates. `supabase/functions/email-programs` runs hourly and sends eligible messages around 9:00 in each student's saved time zone: a three-step getting-started sequence at roughly 1, 3, and 7 days after opt-in, plus a Monday My Schools digest for students with saved schools. Profile holds independent opt-ins for all three optional programs. Every optional message includes a signed, program-specific unsubscribe link and RFC 8058 one-click headers handled by `email-unsubscribe`. Worker runs store privacy-minimized health counters for 90 days; the token-protected `email-health` endpoint is checked hourly from GitHub Actions so missed schedules, failures, and abnormal volume fail externally. Signed Resend events enter through `supabase/functions/resend-webhook`; delivery states update the shared ledger, while bounces, complaints, and suppressions prevent future sends using a privacy-minimized email hash. Each email worker requires both its environment kill switch and its database runtime control to be enabled. Operational details live in `docs/OPERATIONS.md`.
- **Data:** The College Scorecard import currently yields roughly 3,800 schools in Supabase. Browse loads the full paginated catalog; Sage's server-side prompt catalog is intentionally capped at 1,000 schools to control prompt size.

## Project structure
src/

├── components/

│   ├── layout/          # Layout.tsx — nav, bottom tab bar, Back to Sage pill

│   ├── sage/            # SageAvatar.tsx, SageOrb.tsx, SchoolCard.tsx (inline chat cards), WhatSageKnows.tsx

│   └── ui/              # Admyt{Button,Card,Pill}.tsx (bespoke primitives), Modal.tsx (overlay), AuthModal.tsx, ProfileAvatar.tsx, HeartButton.tsx, ScoreRing.tsx

├── context/

│   ├── AuthContext.tsx   # Supabase auth — Google + email, guest-first

│   ├── ChatContext.tsx   # Sage conversation state, hearts, persists to Supabase

│   ├── SageTransitionContext.tsx # Shared landing → chat Sage-orb transition

│   ├── CollegeContext.tsx # Fetches + caches the paginated college catalog

│   └── ProfileContext.tsx # Student profile (location prefs, major, career goals)

├── lib/

│   ├── colleges.ts       # College type + Supabase fetch functions

│   ├── matchScore.ts     # Scoring algorithm — compares college to student profile

│   ├── sagePrompt.ts     # Shared Sage profile type; prompt construction lives server-side

│   ├── savedVibes.ts     # Save/get/delete vibe checks from Supabase

│   └── supabase.ts       # Supabase client

├── pages/

│   ├── Home.tsx          # Sage chat — the core experience

│   ├── Search.tsx        # Browse + filter colleges

│   ├── CollegeDetail.tsx # Full college page with stats, match score, Vibe Check CTA

│   ├── VibeCheck.tsx     # Vibe Check flow — dimension selector + AI results

│   └── Profile.tsx       # Student profile — 4 sections + guest preview

scripts/

└── fetchColleges.mjs     # ETL script — pulls from College Scorecard API → Supabase

supabase/

├── config.toml           # Local Supabase stack configuration

├── migrations/           # Reproducible schema, grants, RLS, and helper functions

└── functions/

├── chat/index.ts    # Anthropic proxy, redacted telemetry, and AI circuit breaker

├── account/index.ts # Authenticated permanent account deletion

├── deadline-reminders/index.ts # Opt-in, deduplicated Resend deadline emails

├── welcome-email/index.ts # One-time, authenticated welcome email

├── email-programs/index.ts # Opt-in guidance sequence and weekly digest worker

├── email-unsubscribe/index.ts # Signed confirmation and one-click opt-out endpoint

├── email-health/index.ts # Token-protected scheduled-worker health endpoint

├── email-operations/index.ts # Admin-only previews, self-test sends, and operations data

└── resend-webhook/index.ts # Signed Resend delivery events and suppressions
## Supabase tables
| Table | Purpose |
|---|---|
| `colleges` | 1,000 schools from College Scorecard API |
| `chat_messages` | Persistent Sage conversation history per user |
| `hearted_schools` | Student's saved/hearted schools |
| `saved_vibes` | Saved Vibe Check results |
| `user_preferences` | Standing filters (states, tuition, major) |
| `notification_preferences` | Independent per-user email opt-ins and time zone |
| `notification_deliveries` | Application-email delivery ledger and duplicate protection |
| `email_delivery_events` | Privacy-minimized, replay-safe Resend delivery events |
| `email_suppressions` | Hashed addresses that must not receive application email |
| `email_worker_runs` | Privacy-minimized scheduled-email health counters (90 days) |
| `data_source_status` | Public catalog provenance and last successful refresh |

All tables have Row Level Security enabled. Users can only access their own data. The `colleges` table is publicly readable (no auth required).

Account export and permanent deletion live in Profile. Retention, AI, Fit Score, and College Scorecard disclosures live at `/data-and-privacy`. Operational procedures are in `docs/OPERATIONS.md`.

Public legal pages live at `/terms` and `/privacy`. Account creation requires affirmative acceptance, confirmation that the user is 13+, and confirmation of parent/guardian permission when the user is under 18. The current policy contact is centralized in `src/lib/legal.ts`.

## Design system
- **Mode:** Light first
- **Background:** `#F8FAFC`
- **Nav/hero accents:** `#0F172A` (midnight)
- **Primary brand:** `#6366F1` (indigo)
- **Accent:** `#818CF8` (lavender)
- **Vibe feature color:** `#F0ABFC` (vibe pink) — used for hearts, Vibe Check accents
- **Match score high:** `#059669` (emerald)
- **Match score mid:** `#6366F1` (indigo)
- **Border radius:** 12-16px on cards, generous throughout
- **Font:** Inter
- **Implementation:** Bespoke hand-written CSS, NOT a UI library. The full UI was redesigned from HTML mockups (`docs/redesign/`) into a custom CSS system in `src/styles/global.css` (native CSS `@layer` cascade layers — works without any build-time CSS framework) + `src/styles/tokens.css`, plus inline styles. **Tailwind CSS and shadcn/ui were removed** — they had been added but never wired into the Vite build (the `@tailwind` directives shipped as dead text), so shadcn components rendered unstyled. Modals are now the bespoke `Modal.tsx`; form inputs use the `.field` class; buttons use `.btn` / `AdmytButton`. Do not re-introduce Tailwind/shadcn — extend the CSS system instead.
- **The `y` accent:** indigo (`#818CF8` on dark / `#6366F1` on light) gradient treatment on the wordmark.
- **Landing → Sage motion:** the canonical `src/assets/sage/sage-orb.webp` is the shared visual identity. The landing CTA moves that same visible orb into the spatial chat shell; never redraw or substitute the orb for this transition. Reduced-motion users receive a short dissolve.
- **Premium landing story:** the landing page is a continuous nine-beat visual narrative, not a premium hero followed by generic marketing cards. From the hero through Vibe Check, it uses one pinned campus world and one mounted canonical Sage orb; the copy, signals, labels, and lighting transform around that shared scene as the user scrolls. Do not remount or repeat the campus image for each chapter. After the pinned sequence releases, the story continues through trust principles, the personal student promise, and the final invitation. Preserve the warm-paper-to-midnight spatial world, glass signal surfaces, and full-viewport pacing when editing it.
- **Premium product continuity:** use “same house, different room.” Landing is cinematic, Sage chat is immersive, Vibe Check is the signature guided-analysis moment, and Browse/School Detail are calmer premium work surfaces. All school recommendations use `src/components/sage/PremiumSchoolCard.tsx`; do not fork Browse and chat card designs again. Preserve search/filter density, scoring behavior, Vibe streaming/persistence/receipts, and the canonical Sage orb while evolving presentation.

## Navigation
- **Desktop:** Top nav — logo, Browse link, ProfileAvatar
- **Mobile:** Bottom tab bar — Chat (`/`), Browse (`/search`), Profile (`/profile`)
- **Floating pill:** "Back to Sage" button appears on `/search`, `/college/:id`, `/college/:id/vibe`

## Auth model
- Guest-first — full app usable without signing in
- Sign-up prompt appears after running a Vibe Check (highest-value moment)
- Supports Google OAuth, Apple OAuth, and passwordless email codes via Supabase Auth
- Signed-in users get: persistent Sage conversation, saved schools, saved vibes, preferences

## Known UX issues (fix in polish pass)
- My schools not always populating from Sage chat hearts — needs end-to-end retest

(Resolved: the preferences modal "hard to see" issue was the shadcn inputs rendering unstyled because Tailwind was never wired into the build. AuthModal + the preferences modal were rebuilt on the bespoke `Modal.tsx` + `.field` system.)

## Roadmap
### Done (redesign pass)
- [x] Full UI redesign from mockups — bespoke CSS design system replaces the old UI
- [x] Removed Tailwind + shadcn/ui; rebuilt modals on bespoke `Modal.tsx` + `.field`
- [x] Fixed preferences modal UX (was unstyled shadcn inputs)
- [x] Brand copy / voice pass across the app
- [x] Premium full-story landing page (pre-auth, tells the Admyt story from hero through final CTA)
- [x] Optimized image assets (PNG → WebP)
- [x] Returning-user recap in Sage chat
- [x] Reproducible Supabase baseline migration + local configuration
- [x] ESLint, Vitest, Playwright, and GitHub Actions quality gates
- [x] Route-level code splitting and bounded Browse rendering
- [x] WCAG-focused accessibility baseline: skip navigation, route announcements and focus management, labelled controls, modal isolation/focus trapping, reduced-motion handling, AA secondary-text contrast, and automated axe coverage for public routes and sign-in

### Soon
- [ ] Scheduled production smoke tests — recommended: GitHub Actions cron (`.github/workflows/smoke.yml`) running *shallow* checks against `youradmyt.vercel.app`: HTTP 200 + correct `<title>`, the `/assets/index-*.js` bundle serves, and the Supabase REST endpoint is reachable; fail the run (email alert) on any miss. Optional: compare the live bundle hash to the latest `main` build to catch a silently-failed deploy. Start daily, tighten to hourly if wanted. (Alternative: a `/schedule` Claude cloud routine that only pings on failure. A *deep* synthetic Playwright check — load app, assert Sage chat / school page / Vibe Check render — can be layered on later.)
- [ ] Live end-to-end verification of production (especially the Vibe Check save flow) at `youradmyt.vercel.app`

### Later
- [ ] Mobile PWA / App Store submission
- [ ] Application tracker (future paywall/premium feature)
- [ ] Post-admit Vibe Check (help students decide between acceptances)
- [ ] Parent-facing experience
- [ ] School/district licensing model
- [ ] Equity narrative — free tier positioning for first-gen and underserved students

## Brand & Voice — Source of Truth

Admyt has a defined brand and voice. Four brand docs live in the repo and are the
standing source of truth for ALL user-facing copy and Sage's personality. Read them
before writing or editing any user-facing text:

- `admyt-brand-story.md` — brand story, values, and the finalized tagline system
- `sage-personality-guide.md` — Sage's voice, traits, rules, and example responses
- `admyt-naming-conventions.md` — what features are named what (respect these exactly)
- `admyt-landing-page-copy.md` — the marketing landing page copy and structure

### Voice rules (quick reference — full detail in the guides)
- Sentence case everywhere. We're a friend, not a headline.
- "You" and "your" constantly. It's about the student.
- Short, real, warm. No jargon, no admissions-speak, no corporate tone.
- Playful, warm, bold. Emoji occasionally and tastefully (👋 ✨ 👇), never overdone.
- Honest about tradeoffs — Sage never just sells a school, never pushes prestige,
  never pressures, never makes a student feel small for their stats or budget.
- The test: would this make a stressed-out 17-year-old feel like they finally found
  something that gets them? If it sounds like a brochure, rewrite it.

### Locked names (never rename)
- **Sage** — the AI advisor/friend
- **Vibe Check** — campus culture fit analysis
- **What Sage knows** — the preferences Sage learns
- **My Schools** — saved/hearted schools
- **Application tracker** — stays descriptive (deadline tool, clarity matters)

### Taglines
- Primary (product + app): **Find where you fit.**
- Brand signature (landing hero): **The y is for you.**
- Emotional (campaigns): **Find your people. Find your place.**
- "Fit" is the brand promise (the what); "Vibe Check" is the feature that delivers it
  (the how). Keep that hierarchy — don't use "vibe" as a brand-level tagline.

### When writing any new copy or feature
Default to Sage's voice. New hero features can earn playful branded names; utilities
stay descriptive (see naming conventions). Let Sage's voice carry warmth where a
plain feature name can't.

## Working style notes
- Use Node 20.19 or newer. Install the lockfile with `npm ci`.
- Run `npm run check` before handoff; run `npm run test:e2e` for navigation, Browse, or other user-flow changes.
- Accessibility coverage lives in `tests/e2e/accessibility.spec.ts` and fails on serious or critical axe violations across the main public routes and sign-in dialog.
- Database changes must be migrations. Verify the complete chain with `npm run db:reset` on a machine with Docker or Podman, then preview remote changes with `npx supabase db push --dry-run`.
- Always use the Supabase Edge Function proxy for Claude API calls — never call Anthropic directly from the browser
- When creating new Supabase tables via SQL Editor, remember to expose them to the API in Table Editor (past gotcha)
- The service role key is only for server-side scripts (fetchColleges.mjs) — never use in browser code
- State abbreviations are used throughout (CA, NY, TX) — not full state names
- college IDs from College Scorecard are numeric strings (e.g. "110635")
- Dev server runs on port 5173 (sometimes 5174/5175 if ports are busy — use `killall node` to reset)
- Always open a new Terminal tab for commands while dev server is running
- Git workflow: use focused branches and commits; never stage unrelated working-tree changes.

## Owner
Dustin Smith-Salinas — Senior PM at Workday, building Admyt as a side project.
GitHub: github.com/dsmithsalinas/admyt
