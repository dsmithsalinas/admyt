alter table public.sage_plans
  add column last_weekly_planned_for date,
  add constraint sage_plans_weekly_planned_monday check (
    last_weekly_planned_for is null
    or extract(isodow from last_weekly_planned_for) = 1
  );

alter table public.sage_plan_tasks
  drop constraint sage_plan_tasks_source_check,
  add column waiting_on text not null default 'none'
    check (waiting_on in ('none', 'parent', 'counselor', 'school', 'other')),
  add constraint sage_plan_tasks_source_check check (
    source in ('manual', 'college_deadline', 'application_checklist', 'stage_transition')
  );

create table public.sage_plan_colleges (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.sage_plans(id) on delete cascade,
  college_id text not null references public.colleges(id) on delete cascade,
  college_name text not null,
  stage text not null default 'planning'
    check (stage in (
      'planning', 'applying', 'submitted', 'complete',
      'admitted', 'waitlisted', 'denied', 'withdrawn'
    )),
  application_round text,
  target_deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sage_plan_colleges_name_length check (char_length(college_name) between 1 and 200),
  constraint sage_plan_colleges_round_length check (
    application_round is null or char_length(application_round) <= 100
  ),
  unique (plan_id, college_id)
);

create index sage_plan_colleges_plan_stage_idx
  on public.sage_plan_colleges (plan_id, stage, college_name);

alter table public.sage_plan_colleges enable row level security;

create policy "users can read colleges in their sage plans"
  on public.sage_plan_colleges for select to authenticated
  using (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_colleges.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can insert colleges in their sage plans"
  on public.sage_plan_colleges for insert to authenticated
  with check (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_colleges.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can update colleges in their sage plans"
  on public.sage_plan_colleges for update to authenticated
  using (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_colleges.plan_id
      and sage_plans.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_colleges.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can delete colleges in their sage plans"
  on public.sage_plan_colleges for delete to authenticated
  using (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_colleges.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));

revoke all on public.sage_plan_colleges from anon, authenticated;
grant select, insert, update, delete on public.sage_plan_colleges to authenticated;
grant select, insert, update, delete on public.sage_plan_colleges to service_role;

comment on table public.sage_plan_colleges is
  'Per-plan application lifecycle state for colleges saved to Sage Plan.';
comment on column public.sage_plan_tasks.waiting_on is
  'A human-readable external blocker that is separate from task dependencies.';
