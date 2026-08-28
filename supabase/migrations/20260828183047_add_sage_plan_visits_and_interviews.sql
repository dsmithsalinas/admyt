create table public.sage_plan_events (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.sage_plans(id) on delete cascade,
  college_id text not null references public.colleges(id) on delete cascade,
  college_name text not null,
  event_type text not null check (event_type in (
    'campus_tour', 'virtual_session', 'open_house',
    'admissions_interview', 'alumni_interview'
  )),
  format text not null check (format in ('in_person', 'virtual')),
  starts_at timestamptz not null,
  time_zone text not null default 'UTC',
  location text,
  registration_url text,
  questions text[] not null default '{}',
  notes text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sage_plan_events_college_name_length check (char_length(college_name) between 1 and 200),
  constraint sage_plan_events_time_zone_length check (char_length(time_zone) between 1 and 100),
  constraint sage_plan_events_location_length check (location is null or char_length(location) <= 500),
  constraint sage_plan_events_registration_url_length check (registration_url is null or char_length(registration_url) <= 2048),
  constraint sage_plan_events_questions_count check (cardinality(questions) <= 20),
  constraint sage_plan_events_questions_length check (char_length(array_to_string(questions, '')) <= 10000),
  constraint sage_plan_events_notes_length check (notes is null or char_length(notes) <= 10000)
);

create index sage_plan_events_plan_starts_idx
  on public.sage_plan_events (plan_id, starts_at)
  where status = 'scheduled';
create index sage_plan_events_college_idx
  on public.sage_plan_events (college_id);

alter table public.sage_plan_tasks
  add column event_id uuid references public.sage_plan_events(id) on delete set null;
create index sage_plan_tasks_event_idx
  on public.sage_plan_tasks (event_id)
  where event_id is not null;

alter table public.sage_plan_tasks
  drop constraint sage_plan_tasks_source_check,
  add constraint sage_plan_tasks_source_check check (
    source in (
      'manual', 'college_deadline', 'application_checklist',
      'financial_aid_checklist', 'stage_transition', 'visit_checklist'
    )
  );

alter table public.sage_plan_events enable row level security;

create policy "users can read events in their sage plans"
  on public.sage_plan_events for select to authenticated
  using (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_events.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can insert events in their sage plans"
  on public.sage_plan_events for insert to authenticated
  with check (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_events.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can update events in their sage plans"
  on public.sage_plan_events for update to authenticated
  using (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_events.plan_id
      and sage_plans.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_events.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can delete events in their sage plans"
  on public.sage_plan_events for delete to authenticated
  using (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_events.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));

revoke all on public.sage_plan_events from anon, authenticated;
grant select, insert, update, delete on public.sage_plan_events to authenticated;
grant select, insert, update, delete on public.sage_plan_events to service_role;

comment on table public.sage_plan_events is
  'Scheduled campus visits and admissions interviews with preparation questions and follow-up notes.';
comment on column public.sage_plan_tasks.event_id is
  'Optional visit or interview that generated or contextualizes this task.';
comment on column public.sage_plan_tasks.source is
  'How a Sage Plan task entered the plan, including deterministic application, financial-aid, and visit checklist packs.';
