alter table public.sage_plan_tasks
  drop constraint sage_plan_tasks_source_check,
  add constraint sage_plan_tasks_source_check check (
    source in (
      'manual',
      'college_deadline',
      'application_checklist',
      'financial_aid_checklist',
      'stage_transition'
    )
  );

comment on column public.sage_plan_tasks.source is
  'How a Sage Plan task entered the plan, including deterministic application and financial-aid checklist packs.';
