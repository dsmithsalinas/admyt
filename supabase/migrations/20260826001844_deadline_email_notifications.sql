create table public.notification_preferences (
  user_id text primary key,
  deadline_reminders_enabled boolean not null default false,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_timezone_length
    check (char_length(timezone) between 1 and 64)
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  kind text not null,
  dedupe_key text not null unique,
  college_id text,
  college_name text,
  deadline_type text,
  deadline_date date,
  lead_days smallint,
  source_url text,
  deadline_verified_at timestamptz,
  status text not null default 'pending',
  attempt_count smallint not null default 1,
  provider_message_id text,
  error_code text,
  last_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_deliveries_kind
    check (kind in ('deadline_reminder')),
  constraint notification_deliveries_status
    check (status in ('pending', 'sent', 'failed')),
  constraint notification_deliveries_lead_days
    check (lead_days is null or lead_days in (7, 30)),
  constraint notification_deliveries_attempt_count
    check (attempt_count between 1 and 3)
);

create index notification_deliveries_user_created_idx
  on public.notification_deliveries (user_id, created_at desc);

create index notification_deliveries_status_attempt_idx
  on public.notification_deliveries (status, last_attempt_at)
  where status in ('pending', 'failed');

alter table public.notification_preferences enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "users can read notification preferences"
  on public.notification_preferences for select to authenticated
  using ((select auth.uid())::text = user_id);

create policy "users can insert notification preferences"
  on public.notification_preferences for insert to authenticated
  with check ((select auth.uid())::text = user_id);

create policy "users can update notification preferences"
  on public.notification_preferences for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

create policy "users can read notification deliveries"
  on public.notification_deliveries for select to authenticated
  using ((select auth.uid())::text = user_id);

revoke all on public.notification_preferences, public.notification_deliveries
  from anon, authenticated;

grant select, insert, update on public.notification_preferences to authenticated;
grant select on public.notification_deliveries to authenticated;
grant select, insert, update, delete on public.notification_preferences,
  public.notification_deliveries to service_role;

-- Atomically reserves one delivery. Failed deliveries and abandoned pending
-- leases can be retried up to three times; sent deliveries are never duplicated.
create or replace function public.claim_notification_delivery(
  p_user_id text,
  p_dedupe_key text,
  p_college_id text,
  p_college_name text,
  p_deadline_type text,
  p_deadline_date date,
  p_lead_days smallint,
  p_source_url text,
  p_deadline_verified_at timestamptz
)
returns table(delivery_id uuid)
language sql
security invoker
set search_path = ''
as $$
  insert into public.notification_deliveries as delivery (
    user_id,
    kind,
    dedupe_key,
    college_id,
    college_name,
    deadline_type,
    deadline_date,
    lead_days,
    source_url,
    deadline_verified_at
  ) values (
    p_user_id,
    'deadline_reminder',
    p_dedupe_key,
    p_college_id,
    p_college_name,
    p_deadline_type,
    p_deadline_date,
    p_lead_days,
    p_source_url,
    p_deadline_verified_at
  )
  on conflict (dedupe_key) do update
    set status = 'pending',
        attempt_count = delivery.attempt_count + 1,
        error_code = null,
        last_attempt_at = now()
    where delivery.status in ('failed', 'pending')
      and delivery.attempt_count < 3
      and delivery.last_attempt_at < now() - interval '15 minutes'
  returning delivery.id;
$$;

revoke all on function public.claim_notification_delivery(
  text, text, text, text, text, date, smallint, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.claim_notification_delivery(
  text, text, text, text, text, date, smallint, text, timestamptz
) to service_role;

-- Keep account deletion complete as new user-owned communication data is added.
create or replace function public.delete_account_data(p_user_id text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.notification_deliveries where user_id = p_user_id;
  delete from public.notification_preferences where user_id = p_user_id;
  delete from public.chat_messages where user_id = p_user_id;
  delete from public.hearted_schools where user_id = p_user_id;
  delete from public.saved_vibes where user_id = p_user_id;
  delete from public.user_preferences where user_id = p_user_id;
end;
$$;

revoke all on function public.delete_account_data(text)
  from public, anon, authenticated;
grant execute on function public.delete_account_data(text) to service_role;
