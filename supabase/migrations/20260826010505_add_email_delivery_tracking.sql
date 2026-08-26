alter table public.notification_deliveries
  add column provider_status text,
  add column provider_status_at timestamptz,
  add constraint notification_deliveries_provider_status
    check (provider_status is null or provider_status in (
      'delivered', 'bounced', 'complained', 'suppressed'
    ));

create index notification_deliveries_provider_message_idx
  on public.notification_deliveries (provider_message_id)
  where provider_message_id is not null;

create table public.email_delivery_events (
  event_id text primary key,
  event_type text not null,
  provider_message_id text,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  constraint email_delivery_events_type
    check (event_type in (
      'email.delivered',
      'email.bounced',
      'email.complained',
      'email.suppressed',
      'suppression.added'
    )),
  constraint email_delivery_events_id_length
    check (char_length(event_id) between 1 and 255)
);

create index email_delivery_events_message_idx
  on public.email_delivery_events (provider_message_id)
  where provider_message_id is not null;

create table public.email_suppressions (
  email_hash text primary key,
  reason text not null,
  provider_message_id text,
  source_event_id text not null references public.email_delivery_events(event_id),
  suppressed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint email_suppressions_hash_format
    check (email_hash ~ '^[0-9a-f]{64}$'),
  constraint email_suppressions_reason
    check (reason in ('bounce', 'complaint', 'provider_suppression', 'manual'))
);

alter table public.email_delivery_events enable row level security;
alter table public.email_suppressions enable row level security;

revoke all on public.email_delivery_events, public.email_suppressions
  from anon, authenticated;
grant select, insert, update, delete on public.email_delivery_events,
  public.email_suppressions to service_role;

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
