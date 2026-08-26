alter table public.notification_preferences
  add column getting_started_opted_in_at timestamptz,
  add column weekly_digest_opted_in_at timestamptz;

update public.notification_preferences
set getting_started_opted_in_at = updated_at
where getting_started_enabled and getting_started_opted_in_at is null;

update public.notification_preferences
set weekly_digest_opted_in_at = updated_at
where weekly_digest_enabled and weekly_digest_opted_in_at is null;

alter table public.notification_deliveries
  drop constraint notification_deliveries_kind,
  add constraint notification_deliveries_kind
    check (kind in (
      'deadline_reminder',
      'welcome',
      'getting_started',
      'weekly_digest'
    ));

-- Reserve an optional program email only while its preference is still on.
-- This closes the race between the worker reading preferences and a student
-- opting out. Sent deliveries remain permanent; transient failures may retry.
create or replace function public.claim_program_delivery(
  p_user_id text,
  p_kind text,
  p_dedupe_key text
)
returns table(delivery_id uuid)
language sql
security invoker
set search_path = ''
as $$
  insert into public.notification_deliveries as delivery (
    user_id,
    kind,
    dedupe_key
  )
  select
    preference.user_id,
    p_kind,
    p_dedupe_key
  from public.notification_preferences as preference
  where preference.user_id = p_user_id
    and (
      (p_kind = 'getting_started' and preference.getting_started_enabled)
      or (p_kind = 'weekly_digest' and preference.weekly_digest_enabled)
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

revoke all on function public.claim_program_delivery(text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_program_delivery(text, text, text)
  to service_role;

-- Check hourly so each student can receive guidance and the Monday digest at
-- 9:00 in their saved time zone. The worker performs all eligibility checks.
do $function$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'admyt_project_url'
  ) or not exists (
    select 1 from vault.decrypted_secrets where name = 'admyt_service_role_key'
  ) then
    raise exception 'email program Vault secrets are missing';
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname in ('admyt-email-programs-daily', 'admyt-email-programs-hourly');

  perform cron.schedule(
    'admyt-email-programs-hourly',
    '0 * * * *',
    $cron$
      select net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'admyt_project_url'
          limit 1
        ) || '/functions/v1/email-programs',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'admyt_service_role_key'
            limit 1
          ),
          'Authorization', 'Bearer ' || (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'admyt_service_role_key'
            limit 1
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      ) as request_id;
    $cron$
  );
end
$function$;
