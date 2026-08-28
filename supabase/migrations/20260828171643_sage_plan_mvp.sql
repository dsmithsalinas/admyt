create table public.sage_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My application plan',
  application_cycle text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  tier text not null default 'free' check (tier in ('free', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sage_plans_name_length check (char_length(name) between 1 and 100),
  constraint sage_plans_cycle_format check (application_cycle ~ '^[0-9]{4}-[0-9]{4}$')
);

create unique index sage_plans_one_active_per_user_idx
  on public.sage_plans (user_id)
  where status = 'active';
create index sage_plans_user_updated_idx
  on public.sage_plans (user_id, updated_at desc);

create table public.sage_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.sage_plans(id) on delete cascade,
  title text not null,
  notes text,
  category text not null default 'other'
    check (category in ('application', 'essay', 'visit', 'financial_aid', 'other')),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'skipped')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  owner_role text not null default 'student'
    check (owner_role in ('student', 'parent')),
  college_id text references public.colleges(id) on delete set null,
  college_name text,
  due_date date,
  scheduled_week date,
  source text not null default 'manual'
    check (source in ('manual', 'college_deadline')),
  source_key text,
  source_url text,
  position integer not null default 0 check (position >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sage_plan_tasks_title_length check (char_length(title) between 1 and 160),
  constraint sage_plan_tasks_notes_length check (notes is null or char_length(notes) <= 4000),
  constraint sage_plan_tasks_college_name_length check (college_name is null or char_length(college_name) <= 200),
  constraint sage_plan_tasks_source_key_length check (source_key is null or char_length(source_key) <= 240),
  constraint sage_plan_tasks_source_url_length check (source_url is null or char_length(source_url) <= 2048),
  constraint sage_plan_tasks_scheduled_monday check (
    scheduled_week is null or extract(isodow from scheduled_week) = 1
  ),
  constraint sage_plan_tasks_completed_state check (
    (status = 'done' and completed_at is not null) or
    (status <> 'done' and completed_at is null)
  )
);

create index sage_plan_tasks_plan_due_idx
  on public.sage_plan_tasks (plan_id, due_date)
  where status not in ('done', 'skipped');
create index sage_plan_tasks_plan_week_idx
  on public.sage_plan_tasks (plan_id, scheduled_week, position);
create index sage_plan_tasks_plan_owner_idx
  on public.sage_plan_tasks (plan_id, owner_role, status);
create unique index sage_plan_tasks_source_key_idx
  on public.sage_plan_tasks (plan_id, source_key)
  where source_key is not null;

create table public.sage_plan_task_dependencies (
  task_id uuid not null references public.sage_plan_tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.sage_plan_tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id),
  constraint sage_plan_task_dependencies_no_self check (task_id <> depends_on_task_id)
);

create index sage_plan_task_dependencies_reverse_idx
  on public.sage_plan_task_dependencies (depends_on_task_id, task_id);

alter table public.sage_plans enable row level security;
alter table public.sage_plan_tasks enable row level security;
alter table public.sage_plan_task_dependencies enable row level security;

create policy "users can read their sage plans"
  on public.sage_plans for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users can insert their sage plans"
  on public.sage_plans for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users can update their sage plans"
  on public.sage_plans for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users can delete their sage plans"
  on public.sage_plans for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can read tasks in their sage plans"
  on public.sage_plan_tasks for select to authenticated
  using (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_tasks.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can insert tasks in their sage plans"
  on public.sage_plan_tasks for insert to authenticated
  with check (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_tasks.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can update tasks in their sage plans"
  on public.sage_plan_tasks for update to authenticated
  using (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_tasks.plan_id
      and sage_plans.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_tasks.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can delete tasks in their sage plans"
  on public.sage_plan_tasks for delete to authenticated
  using (exists (
    select 1 from public.sage_plans
    where sage_plans.id = sage_plan_tasks.plan_id
      and sage_plans.user_id = (select auth.uid())
  ));

create policy "users can read dependencies in their sage plans"
  on public.sage_plan_task_dependencies for select to authenticated
  using (exists (
    select 1
    from public.sage_plan_tasks
    join public.sage_plans on sage_plans.id = sage_plan_tasks.plan_id
    where sage_plan_tasks.id = sage_plan_task_dependencies.task_id
      and sage_plans.user_id = (select auth.uid())
  ));
create policy "users can insert dependencies in their sage plans"
  on public.sage_plan_task_dependencies for insert to authenticated
  with check (
    exists (
      select 1
      from public.sage_plan_tasks task
      join public.sage_plans on sage_plans.id = task.plan_id
      where task.id = sage_plan_task_dependencies.task_id
        and sage_plans.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.sage_plan_tasks dependency
      join public.sage_plan_tasks task on task.id = sage_plan_task_dependencies.task_id
      where dependency.id = sage_plan_task_dependencies.depends_on_task_id
        and dependency.plan_id = task.plan_id
    )
  );
create policy "users can delete dependencies in their sage plans"
  on public.sage_plan_task_dependencies for delete to authenticated
  using (exists (
    select 1
    from public.sage_plan_tasks
    join public.sage_plans on sage_plans.id = sage_plan_tasks.plan_id
    where sage_plan_tasks.id = sage_plan_task_dependencies.task_id
      and sage_plans.user_id = (select auth.uid())
  ));

revoke all on public.sage_plans, public.sage_plan_tasks,
  public.sage_plan_task_dependencies from anon, authenticated;

grant select, insert, update, delete on public.sage_plans,
  public.sage_plan_tasks to authenticated;
grant select, insert, delete on public.sage_plan_task_dependencies to authenticated;
grant select, insert, update, delete on public.sage_plans,
  public.sage_plan_tasks, public.sage_plan_task_dependencies to service_role;

comment on table public.sage_plans is
  'Student-owned application plans. Parent collaboration is represented by task ownership in the MVP.';
comment on table public.sage_plan_tasks is
  'Weekly application work, imported deadlines, responsibility, and progress for Sage Plan.';
comment on table public.sage_plan_task_dependencies is
  'Optional ordering dependencies between tasks in the same Sage Plan.';

-- Keep authenticated account deletion complete even if deleting the Auth user
-- fails after the data-removal RPC succeeds. Tasks and dependencies cascade.
create or replace function public.delete_account_data(p_user_id text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.sage_plans where user_id = p_user_id::uuid;
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
