-- Ship-blocker migrations — run once in the Supabase SQL Editor.
-- Covers two of the launch blockers that require database changes:
--   #2  Lock down anonymous writes to the colleges table
--   #4  Add the heart_action_count column the app expects

-- ── #2  colleges: read-only for anon/authenticated ───────────────────────────
-- RLS is already enabled with SELECT open, but a permissive UPDATE policy lets
-- anyone with the public anon key overwrite any college row. Drop every existing
-- policy and recreate a single read-only one. The chat edge function writes
-- descriptions with the service-role key, which bypasses RLS, so caching still works.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'colleges'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.colleges', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colleges are publicly readable"
  ON public.colleges
  FOR SELECT
  USING (true);

-- ── #4  user_preferences: heart_action_count ─────────────────────────────────
-- The app reads/writes heart_action_count from user_preferences (previously it
-- pointed at a non-existent `user_prefs` table). Add the column.
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS heart_action_count integer NOT NULL DEFAULT 0;
