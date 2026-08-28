alter table public.sage_plan_events
  add constraint sage_plan_events_id_plan_unique unique (id, plan_id);

alter table public.sage_plan_tasks
  drop constraint sage_plan_tasks_event_id_fkey,
  add constraint sage_plan_tasks_event_plan_fkey
    foreign key (event_id, plan_id)
    references public.sage_plan_events (id, plan_id)
    on delete set null (event_id);

comment on constraint sage_plan_tasks_event_plan_fkey on public.sage_plan_tasks is
  'Keeps a generated task attached only to an event in the same Sage Plan.';
