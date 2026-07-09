-- Optional housekeeping for the rate_limits table (#12): one row accumulates per
-- unique IP forever. This schedules a daily delete of stale rows via pg_cron.
-- Run once in the SQL Editor. Safe to re-run (cron.schedule upserts by job name).

-- pg_cron must be enabled. This usually works from the SQL editor; if it errors,
-- enable it in Dashboard > Database > Extensions, then re-run the rest.
create extension if not exists pg_cron;

-- The rate-limit window is seconds, so any row untouched for a day is stale.
-- Runs daily at 03:00 UTC.
select cron.schedule(
  'cleanup-rate-limits',
  '0 3 * * *',
  $$ delete from public.rate_limits where window_start < now() - interval '1 day' $$
);

-- To remove the job later:  select cron.unschedule('cleanup-rate-limits');
