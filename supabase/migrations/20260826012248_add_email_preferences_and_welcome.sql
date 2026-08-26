alter table public.notification_preferences
  add column getting_started_enabled boolean not null default false,
  add column weekly_digest_enabled boolean not null default false;

alter table public.notification_deliveries
  drop constraint notification_deliveries_kind,
  add constraint notification_deliveries_kind
    check (kind in ('deadline_reminder', 'welcome'));

-- Atomically reserve the one welcome message for a user. Repeated client
-- invocations are safe, while transient failures may retry after the lease.
create or replace function public.claim_welcome_delivery(p_user_id text)
returns table(delivery_id uuid)
language sql
security invoker
set search_path = ''
as $$
  insert into public.notification_deliveries as delivery (
    user_id,
    kind,
    dedupe_key
  ) values (
    p_user_id,
    'welcome',
    'welcome|' || p_user_id
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

revoke all on function public.claim_welcome_delivery(text)
  from public, anon, authenticated;
grant execute on function public.claim_welcome_delivery(text) to service_role;

-- A hard bounce, complaint, or provider suppression turns off every optional
-- email program for the affected account. The one-time welcome stays recorded
-- in the delivery ledger and is protected by the suppression check at send time.
create or replace function public.process_resend_delivery_event(
  p_event_id text,
  p_event_type text,
  p_provider_message_id text,
  p_occurred_at timestamptz,
  p_email_hash text default null,
  p_suppression_reason text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted boolean;
  next_status text;
begin
  insert into public.email_delivery_events (
    event_id,
    event_type,
    provider_message_id,
    occurred_at
  ) values (
    p_event_id,
    p_event_type,
    p_provider_message_id,
    p_occurred_at
  )
  on conflict (event_id) do nothing
  returning true into inserted;

  if not coalesce(inserted, false) then
    return false;
  end if;

  next_status := case p_event_type
    when 'email.delivered' then 'delivered'
    when 'email.bounced' then 'bounced'
    when 'email.complained' then 'complained'
    when 'email.suppressed' then 'suppressed'
    else null
  end;

  if next_status is not null and p_provider_message_id is not null then
    update public.notification_deliveries
      set provider_status = next_status,
          provider_status_at = p_occurred_at
      where provider_message_id = p_provider_message_id
        and (provider_status_at is null or provider_status_at <= p_occurred_at);
  end if;

  if p_email_hash is not null and p_suppression_reason is not null then
    insert into public.email_suppressions as suppression (
      email_hash,
      reason,
      provider_message_id,
      source_event_id,
      suppressed_at
    ) values (
      p_email_hash,
      p_suppression_reason,
      p_provider_message_id,
      p_event_id,
      p_occurred_at
    )
    on conflict (email_hash) do update
      set reason = excluded.reason,
          provider_message_id = excluded.provider_message_id,
          source_event_id = excluded.source_event_id,
          suppressed_at = excluded.suppressed_at,
          updated_at = now()
      where suppression.suppressed_at <= excluded.suppressed_at;

    if p_provider_message_id is not null then
      update public.notification_preferences
        set deadline_reminders_enabled = false,
            getting_started_enabled = false,
            weekly_digest_enabled = false,
            updated_at = now()
        where user_id in (
          select delivery.user_id
          from public.notification_deliveries as delivery
          where delivery.provider_message_id = p_provider_message_id
        );
    end if;
  end if;

  return true;
end;
$$;

revoke all on function public.process_resend_delivery_event(
  text, text, text, timestamptz, text, text
) from public, anon, authenticated;
grant execute on function public.process_resend_delivery_event(
  text, text, text, timestamptz, text, text
) to service_role;
