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
