create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $function$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'admyt_project_url'
  ) or not exists (
    select 1 from vault.decrypted_secrets where name = 'admyt_service_role_key'
  ) then
    raise exception 'deadline reminder Vault secrets are missing';
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'admyt-deadline-reminders-daily';

  perform cron.schedule(
    'admyt-deadline-reminders-daily',
    '0 15 * * *',
    $cron$
      select net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'admyt_project_url'
          limit 1
        ) || '/functions/v1/deadline-reminders',
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
