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
- **Deployment:** Vercel — live at `youradmyt.vercel.app`, auto-deploys on every push to `main` (Vercel GitHub integration). Per-deploy/preview URLs are gated by Vercel Deployment Protection; the `youradmyt.vercel.app` production domain is public. Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars set in the Vercel project.
- **Data:** 1,000 colleges from College Scorecard API, stored in Supabase `colleges` table

## Project structure
src/

├── components/

│   ├── layout/          # Layout.tsx — nav, bottom tab bar, Back to Sage pill

│   ├── sage/            # SageAvatar.tsx, SageOrb.tsx, SchoolCard.tsx (inline chat cards), WhatSageKnows.tsx

│   └── ui/              # Admyt{Button,Card,Pill}.tsx (bespoke primitives), Modal.tsx (overlay), AuthModal.tsx, ProfileAvatar.tsx, HeartButton.tsx, ScoreRing.tsx

├── context/

│   ├── AuthContext.tsx   # Supabase auth — Google + email, guest-first

│   ├── ChatContext.tsx   # Sage conversation state, hearts, persists to Supabase

│   ├── CollegeContext.tsx # Fetches + caches 1,000 colleges from Supabase

│   └── ProfileContext.tsx # Student profile (location prefs, major, career goals)

├── lib/

│   ├── claude.ts         # Claude API helpers (getCollegeMatches, runVibeCheck, getAdmitOdds)

│   ├── colleges.ts       # College type + Supabase fetch functions

│   ├── matchScore.ts     # Scoring algorithm — compares college to student profile

│   ├── sagePrompt.ts     # Builds Sage system prompt with college catalog

│   ├── savedVibes.ts     # Save/get/delete vibe checks from Supabase

│   └── supabase.ts       # Supabase client

├── pages/

│   ├── Home.tsx          # Sage chat — the core experience

│   ├── Search.tsx        # Browse + filter colleges

│   ├── CollegeDetail.tsx # Full college page with stats, match score, Vibe Check CTA

│   ├── VibeCheck.tsx     # Vibe Check flow — dimension selector + AI results

│   └── Profile.tsx       # Student profile — 4 sections + guest preview

└── types/

└── index.ts          # Core TypeScript interfaces

scripts/

└── fetchColleges.mjs     # ETL script — pulls from College Scorecard API → Supabase

supabase/

└── functions/

└── chat/

└── index.ts      # Edge function proxy for Anthropic API calls
## Supabase tables
| Table | Purpose |
|---|---|
| `colleges` | 1,000 schools from College Scorecard API |
| `chat_messages` | Persistent Sage conversation history per user |
| `hearted_schools` | Student's saved/hearted schools |
| `saved_vibes` | Saved Vibe Check results |
| `user_preferences` | Standing filters (states, tuition, major) |

All tables have Row Level Security enabled. Users can only access their own data. The `colleges` table is publicly readable (no auth required).

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

## Navigation
- **Desktop:** Top nav — logo, Browse link, ProfileAvatar
- **Mobile:** Bottom tab bar — Chat (`/`), Browse (`/search`), Profile (`/profile`)
- **Floating pill:** "Back to Sage" button appears on `/search`, `/college/:id`, `/college/:id/vibe`

## Auth model
- Guest-first — full app usable without signing in
- Sign-up prompt appears after running a Vibe Check (highest-value moment)
- Supports Google OAuth and email/password via Supabase Auth
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
- [x] Landing/marketing page (pre-auth, tells the Admyt story)
- [x] Optimized image assets (PNG → WebP)

### Soon
- [ ] Scheduled production smoke tests — recommended: GitHub Actions cron (`.github/workflows/smoke.yml`) running *shallow* checks against `youradmyt.vercel.app`: HTTP 200 + correct `<title>`, the `/assets/index-*.js` bundle serves, and the Supabase REST endpoint is reachable; fail the run (email alert) on any miss. Optional: compare the live bundle hash to the latest `main` build to catch a silently-failed deploy. Start daily, tighten to hourly if wanted. (Alternative: a `/schedule` Claude cloud routine that only pings on failure. A *deep* synthetic Playwright check — load app, assert Sage chat / school page / Vibe Check render — can be layered on later.)
- [ ] Live end-to-end verification of production (especially the Vibe Check save flow) at `youradmyt.vercel.app`
- [ ] Returning user recap — Sage greets signed-in users with conversation recap

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
- Always use the Supabase Edge Function proxy for Claude API calls — never call Anthropic directly from the browser
- When creating new Supabase tables via SQL Editor, remember to expose them to the API in Table Editor (past gotcha)
- The service role key is only for server-side scripts (fetchColleges.mjs) — never use in browser code
- State abbreviations are used throughout (CA, NY, TX) — not full state names
- college IDs from College Scorecard are numeric strings (e.g. "110635")
- Dev server runs on port 5173 (sometimes 5174/5175 if ports are busy — use `killall node` to reset)
- Always open a new Terminal tab for commands while dev server is running
- Git workflow: `git add . && git commit -m "description" && git push`

## Owner
Dustin Smith-Salinas — Senior PM at Workday, building Admyt as a side project.
GitHub: github.com/dsmithsalinas/admyt
