# Admyt — Agent Context

**`CLAUDE.md` is the single source of truth for this project.**

All project context — what Admyt is, Sage's personality, the tech stack, styling
system, project structure, Supabase tables, design system, naming conventions,
working-style notes, and roadmap — lives in [`CLAUDE.md`](./CLAUDE.md). Read it
first, and keep it (not this file) up to date when things change.

This file exists only so agents that look for `AGENTS.md` (e.g. Codex) are pointed
to the canonical doc instead of working from a stale duplicate.

## Quick orientation
- **Stack:** React + Vite + TypeScript, Supabase (auth/db/edge functions), Anthropic
  Claude API via the `supabase/functions/chat` edge-function proxy (never call
  Anthropic directly from the browser).
- **Styling:** bespoke hand-written CSS (`src/styles/global.css` + `tokens.css`) and
  inline styles. **No Tailwind, no shadcn/ui** — they were removed; don't reintroduce
  them. Extend the CSS system instead.
- **Brand & voice:** governed by `admyt-brand-story.md`, `sage-personality-guide.md`,
  `admyt-naming-conventions.md`, and `admyt-landing-page-copy.md`. Read them before
  writing any user-facing copy.

See `CLAUDE.md` for the full detail.
