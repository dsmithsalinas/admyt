-- Application deadlines, cached per school (shared across all users). Populated
-- lazily by the chat edge function (type: 'deadline') the first time any user
-- hearts a school; every later read is a cache hit. Run once in the SQL Editor.

create table if not exists public.college_deadlines (
  college_id text primary key,
  deadlines jsonb,
  updated_at timestamptz not null default now()
);

-- Public read (non-sensitive, like colleges); writes only via the service-role
-- key in the edge function, which bypasses RLS.
alter table public.college_deadlines enable row level security;

create policy "deadlines are publicly readable"
  on public.college_deadlines
  for select
  using (true);

-- A raw CREATE TABLE grants no privileges to the PostgREST roles (unlike the
-- dashboard Table Editor). Without these, both the anon read and the edge
-- function's service-role writes fail with 42501 permission denied.
grant select on public.college_deadlines to anon, authenticated;
grant select, insert, update on public.college_deadlines to service_role;
