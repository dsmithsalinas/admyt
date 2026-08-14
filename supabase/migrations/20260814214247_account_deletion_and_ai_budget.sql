-- Account lifecycle, catalog provenance, and a global AI-usage circuit breaker.

create table if not exists public.data_source_status (
  source text primary key,
  last_refreshed_at timestamptz not null,
  record_count integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.data_source_status enable row level security;

drop policy if exists "data source status is publicly readable"
  on public.data_source_status;
create policy "data source status is publicly readable"
  on public.data_source_status for select to anon, authenticated using (true);

revoke all on public.data_source_status from anon, authenticated;
grant select on public.data_source_status to anon, authenticated;
grant select, insert, update, delete on public.data_source_status to service_role;

-- Seed provenance for an existing dashboard-era catalog. Future imports update
-- this row explicitly after every fully successful College Scorecard refresh.
insert into public.data_source_status (
  source,
  last_refreshed_at,
  record_count,
  details
)
select
  'college_scorecard',
  max(created_at),
  count(*)::integer,
  jsonb_build_object('provider', 'U.S. Department of Education College Scorecard')
from public.colleges
having count(*) > 0
on conflict (source) do nothing;

-- Called only by the authenticated account Edge Function with the service role.
-- SECURITY INVOKER means the caller keeps its own privileges; service_role is
-- already the only role allowed to execute it and bypasses RLS itself.
create or replace function public.delete_account_data(p_user_id text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.chat_messages where user_id = p_user_id;
  delete from public.hearted_schools where user_id = p_user_id;
  delete from public.saved_vibes where user_id = p_user_id;
  delete from public.user_preferences where user_id = p_user_id;
end;
$$;

revoke all on function public.delete_account_data(text)
  from public, anon, authenticated;
grant execute on function public.delete_account_data(text) to service_role;

-- Reserve one unit of the shared rolling 24-hour AI budget and return enough
-- state for redacted operational logs. This complements Anthropic's hard
-- workspace spend cap; it is not a substitute for the billing-side limit.
create or replace function public.consume_ai_request_budget(p_limit integer)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
  v_window_start timestamptz;
  v_limit integer := greatest(p_limit, 1);
begin
  insert into public.rate_limits as rl (key, count, window_start)
    values ('global:anthropic:rolling-day', 1, now())
  on conflict (key) do update
    set count = case
          when rl.window_start < now() - interval '1 day' then 1
          else rl.count + 1
        end,
        window_start = case
          when rl.window_start < now() - interval '1 day' then now()
          else rl.window_start
        end
  returning rl.count, rl.window_start into v_count, v_window_start;

  return jsonb_build_object(
    'allowed', v_count <= v_limit,
    'count', v_count,
    'limit', v_limit,
    'window_start', v_window_start
  );
end;
$$;

revoke all on function public.consume_ai_request_budget(integer)
  from public, anon, authenticated;
grant execute on function public.consume_ai_request_budget(integer)
  to service_role;
