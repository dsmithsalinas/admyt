-- Per-IP rate limiting for the chat edge function (#12).
-- Run once in the Supabase SQL Editor, then redeploy the function:
--   supabase functions deploy chat

-- Counter table. One row per rate-limit key (e.g. "ip:1.2.3.4").
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

-- Only the service role (which bypasses RLS) ever touches this table; enabling RLS
-- with no policies blocks the public anon key from reading or writing it.
alter table public.rate_limits enable row level security;

-- Atomic check-and-increment. Returns true if the caller is still under the limit.
-- Doing the reset/increment in a single upsert makes it race-safe under concurrency.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
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

-- Keep the function callable only by the server-side service role.
revoke execute on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
