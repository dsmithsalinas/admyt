create table public.email_worker_runs (
  id uuid primary key default gen_random_uuid(),
  worker text not null,
  request_id text not null unique,
  status text not null,
  metrics jsonb not null default '{}'::jsonb,
  error_code text,
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  duration_ms integer not null,
  constraint email_worker_runs_worker
    check (worker in ('deadline_reminders', 'email_programs')),
  constraint email_worker_runs_status
    check (status in ('success', 'failed', 'disabled')),
  constraint email_worker_runs_request_id_length
    check (char_length(request_id) between 1 and 255),
  constraint email_worker_runs_duration
    check (duration_ms >= 0),
  constraint email_worker_runs_metrics_object
    check (jsonb_typeof(metrics) = 'object')
);

create index email_worker_runs_worker_finished_idx
  on public.email_worker_runs (worker, finished_at desc);

create index email_worker_runs_failed_finished_idx
  on public.email_worker_runs (finished_at desc)
  where status = 'failed';

alter table public.email_worker_runs enable row level security;

revoke all on public.email_worker_runs from anon, authenticated;
grant select, insert, update, delete on public.email_worker_runs to service_role;

-- Operational history is intentionally short-lived. Delivery and webhook
-- records retain their existing lifecycle; this table stores aggregate health
-- counters only and is pruned weekly.
do $function$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'admyt-email-worker-run-cleanup';

  perform cron.schedule(
    'admyt-email-worker-run-cleanup',
    '30 3 * * 0',
    $cron$
      delete from public.email_worker_runs
      where finished_at < now() - interval '90 days';
    $cron$
  );
end
$function$;
