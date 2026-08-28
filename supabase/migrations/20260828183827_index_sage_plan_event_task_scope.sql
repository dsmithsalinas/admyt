drop index public.sage_plan_tasks_event_idx;

create index sage_plan_tasks_event_plan_idx
  on public.sage_plan_tasks (event_id, plan_id);
