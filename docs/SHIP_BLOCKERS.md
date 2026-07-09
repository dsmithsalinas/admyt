# Ship-blocker fixes — what shipped in code vs. what you must run

Five confirmed launch blockers. Code changes are committed; three of them also
need a manual step against Supabase/Vercel that can't be done from the repo alone.

## 1. SPA deep links 404'd in production ✅ code only
- **Fix:** added `vercel.json` with a catch-all rewrite to `/index.html`.
- **Action:** none — Vercel picks this up on the next deploy. After deploy, verify
  `https://youradmyt.vercel.app/search` returns 200 (it returned 404 before).

## 2. Anyone could overwrite the colleges table ⚠️ code + SQL + edge deploy
- **Code:** removed the browser-side `colleges` write in `CollegeDetail.tsx`;
  description caching now happens in the `chat` edge function using the
  service-role key.
- **Run the SQL:** open Supabase → SQL Editor → run
  `supabase/migrations/20260708_ship_blockers.sql` (drops the permissive UPDATE
  policy, leaves the table read-only for anon).
- **Redeploy the edge function** so it can cache descriptions server-side:
  ```
  supabase functions deploy chat
  ```
  `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the
  Supabase runtime — no extra secrets needed. (`ANTHROPIC_API_KEY` must already be
  set as a function secret.)
- **Verify:** an anon PATCH to `/rest/v1/colleges` should now return 401/403.

## 3. "Save this conversation" lost the conversation ✅ code only
- **Fix:** on sign-in, guest chat messages and hearts are now persisted under the
  new user and merged with any existing server history (instead of the server load
  wiping the in-memory guest session). See `migrateGuestData` in `ChatContext.tsx`.

## 4. `user_prefs` table didn't exist ⚠️ code + SQL
- **Code:** the app now reads/writes `heart_action_count` on `user_preferences`
  (which exists) instead of the missing `user_prefs` table, and uses
  `maybeSingle()` so a missing row no longer throws.
- **Run the SQL:** same migration file as #2 adds the `heart_action_count` column.

## 5. USC / Columbia / Brown / UChicago / BC never appeared in Browse ✅ code only
- **Fix:** the tuition slider ceiling is now `$80k` (above the ~$72k data max) and
  parking it at the top means "no limit" instead of filtering out the priciest
  schools. See `TUITION_MAX` in `Search.tsx`.

---

### Manual checklist before you flip the switch
- [ ] Run `supabase/migrations/20260708_ship_blockers.sql` in the SQL Editor
- [ ] `supabase functions deploy chat`
- [ ] Push to `main` (Vercel auto-deploys `vercel.json`)
- [ ] Smoke-test: hard-refresh `/search`, save a guest conversation, browse to USC

---

## High tier

## Low / polish tier ✅ code only

- **#18** Defined the missing `--admyt-gold` token (the landing "What we stand for" 4th dot was invisible).
- **#19** Not a bug — the `.fade-up` scroll-animation CSS exists in tokens.css. (Audit miscall, no change.)
- **#20** Removed dead code: `src/types/index.ts`, `src/data/sampleColleges.ts`, the `Onboarding` page + route, the unused `src/lib/claude.ts`, and the unused `@anthropic-ai/sdk` dependency.
- **#21** `toggleHeart` advances the heart count through a ref, so two fast hearts don't collapse into one increment.
- **#22** The "save this conversation" banner counts only visible messages (hidden `[HEARTED]` events no longer trip the threshold).
- **#23** AuthModal guards against Enter-key double-submit; `Modal` now traps focus (focus moves in on open, Tab cycles inside, focus restores on close).

## Medium tier

Mostly pure code (live on next Vercel deploy). One needs an edge redeploy:

- **#12 edge-function abuse guards** ⚠️ needs `supabase functions deploy chat`. Clamps `max_tokens` (≤2048) and rejects oversized payloads (>1MB) / absurd message counts (>1000). Full per-IP rate limiting still a follow-up (needs a store).
- **#13** API/edge errors no longer get persisted as permanent "Sage" messages — `callEdge` throws so the error stays transient. ✅ code only.
- **#14** A re-run Vibe Check can be saved again (the `saved` flag resets on each new result). ✅ code only.
- **#15** Email signup that requires confirmation now shows a "check your email" state instead of silently closing. Behavior depends on your Supabase Auth "Confirm email" setting. ✅ code only.
- **#16** For-profit schools (`private_np`) now labeled "For-profit" instead of "Private" in Browse + detail. ✅ code only.
- **#17** UC campuses shorten correctly (UCLA → "UC Los Angeles") instead of all collapsing to "U of California". ✅ code only.

### #6/#7 Sage's learned profile evaporated on reload / new PREFS wiped old ones ⚠️ code + SQL
- **Code:** the chat-learned profile now persists to localStorage (guests +
  instant hydration) and to a `sage_profile` jsonb column on `user_preferences`
  (authoritative, cross-device) loaded in `loadUserData`. `applyPrefs` now *merges*
  incoming preferences (case-insensitive union for arrays, non-empty major wins)
  instead of replacing — so a later PREFS with empty arrays can't wipe what Sage knew.
- **Run the SQL:** open Supabase → SQL Editor → run
  `supabase/migrations/20260708_sage_profile.sql` (adds the `sage_profile` column).
  Until you run it, guests/reload still work via localStorage; only cross-device
  sync for signed-in users is inactive.
