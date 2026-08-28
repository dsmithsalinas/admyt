create index sage_plan_tasks_college_idx
  on public.sage_plan_tasks (college_id)
  where college_id is not null;
