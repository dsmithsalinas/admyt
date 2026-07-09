-- High-tier fix #6: persist the chat-learned profile (locations, career goals,
-- intended major) so it survives reloads and syncs across a signed-in user's
-- devices. Stored as a JSON blob on user_preferences.
-- Run once in the Supabase SQL Editor.

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS sage_profile jsonb;
