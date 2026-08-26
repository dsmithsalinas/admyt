-- Private operational records. Only Edge Functions using the service role may
-- read or mutate these tables.
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id text not null,
  admin_email text not null,
  action text not null check (char_length(action) between 1 and 80),
  target_type text check (target_type is null or char_length(target_type) <= 40),
  target_id text check (target_id is null or char_length(target_id) <= 160),
  outcome text not null default 'success' check (outcome in ('success', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint admin_audit_metadata_size check (octet_length(metadata::text) <= 4096)
);

create index admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

create table public.admin_runtime_controls (
  key text primary key check (key in (
    'welcome_email_enabled',
    'deadline_reminders_enabled',
    'email_programs_enabled'
  )),
  enabled boolean not null default true,
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into public.admin_runtime_controls (key, enabled) values
  ('welcome_email_enabled', true),
  ('deadline_reminders_enabled', true),
  ('email_programs_enabled', true);

create table public.app_public_status (
  singleton boolean primary key default true check (singleton),
  maintenance_enabled boolean not null default false,
  message text,
  updated_at timestamptz not null default now(),
  constraint app_public_status_message_length
    check (message is null or char_length(message) between 1 and 240),
  constraint app_public_status_message_required
    check (not maintenance_enabled or message is not null)
);

insert into public.app_public_status (singleton, maintenance_enabled, message)
values (true, false, null);

create table public.admin_deadline_previews (
  id uuid primary key default gen_random_uuid(),
  college_id text not null,
  college_name text not null,
  deadlines jsonb not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes',
  accepted_at timestamptz,
  constraint admin_deadline_preview_object check (jsonb_typeof(deadlines) = 'object'),
  constraint admin_deadline_preview_expiry check (expires_at > created_at)
);

create index admin_deadline_previews_expiry_idx
  on public.admin_deadline_previews (expires_at)
  where accepted_at is null;

alter table public.admin_audit_log enable row level security;
alter table public.admin_runtime_controls enable row level security;
alter table public.app_public_status enable row level security;
alter table public.admin_deadline_previews enable row level security;

revoke all on public.admin_audit_log, public.admin_runtime_controls,
  public.app_public_status, public.admin_deadline_previews from anon, authenticated;

grant select, insert on public.admin_audit_log to service_role;
grant select, insert, update on public.admin_runtime_controls to service_role;
grant select, insert, update on public.app_public_status to service_role;
grant select, insert, update, delete on public.admin_deadline_previews to service_role;

grant select on public.app_public_status to anon, authenticated;
create policy "public maintenance status is readable"
  on public.app_public_status for select to anon, authenticated using (true);

comment on table public.admin_audit_log is
  'Privacy-minimized audit trail for authenticated admin operations.';
comment on table public.app_public_status is
  'Public singleton containing only the active maintenance notice.';

-- Keep operational history bounded and discard expired, unused previews.
do $function$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'admyt-admin-operations-cleanup';

  perform cron.schedule(
    'admyt-admin-operations-cleanup',
    '45 3 * * 0',
    $cron$
      delete from public.admin_audit_log
      where created_at < now() - interval '365 days';
      delete from public.admin_deadline_previews
      where expires_at < now() - interval '7 days';
    $cron$
  );
end
$function$;
