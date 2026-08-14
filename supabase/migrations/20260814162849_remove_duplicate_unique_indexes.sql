-- The baseline intentionally preserved the live unique constraints, whose
-- backing indexes already enforce these column combinations. Remove the three
-- equivalent standalone indexes created by the repair migration.
drop index if exists public.hearted_schools_user_college_idx;
drop index if exists public.saved_vibes_user_college_idx;
drop index if exists public.user_preferences_user_idx;
