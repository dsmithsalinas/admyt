-- Atomic per-IP rate limiting for the chat Edge Function. The function runs as
-- the service-role caller; SECURITY INVOKER avoids exposing an RLS-bypassing
-- SECURITY DEFINER function through the public Data API schema.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as rl (key, count, window_start)
    values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else rl.count + 1
        end,
        window_start = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else rl.window_start
        end
  returning rl.count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer)
  to service_role;

-- One row is created per observed IP. Keep the table bounded by removing rows
-- that have been outside every possible active rate-limit window for a day.
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-admyt-rate-limits',
  '17 3 * * *',
  $$ delete from public.rate_limits where window_start < now() - interval '1 day' $$
);
