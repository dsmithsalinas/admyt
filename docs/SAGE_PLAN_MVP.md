# Sage Plan MVP

## Product fit

Sage Plan is Admyt's execution layer. Sage and Browse help a student decide which
schools fit; My Schools remembers the shortlist; Sage Plan turns that shortlist
into a calm, current answer to three questions:

1. What should I do this week?
2. What needs attention next?
3. Is this mine or my parent's?

It is a module inside the signed-in Admyt experience, not a second application.
It reuses the current app shell, cards, pills, fields, buttons, responsive
breakpoints, and plain-language trust patterns.

## Existing-product audit

Evidence captured on August 28, 2026:

- [Profile empty state](./sage-plan-audit/01-profile-empty.png): Profile is a
  two-column memory surface built around What Sage knows, My Schools, Vibe
  Checks, and profile strength. It is already dense enough; adding a full task
  manager here would blur its job.
- [Browse](./sage-plan-audit/02-browse.png): Browse establishes the visual
  language Sage Plan should inherit: a strong but calm hero, white work surfaces,
  indigo/lavender accents, compact pills, and Sage nearby without making every
  action an AI action.
- [Signed-out Plan](./sage-plan-audit/03-sage-plan-guest.png): the new module
  explains its value without exposing private planning state and routes a guest
  toward account creation or My Schools.
- [Mobile Plan](./sage-plan-audit/04-sage-plan-mobile.png): the fourth navigation
  destination and entry state reflow without horizontal scrolling or covered
  controls.
- [Signed-in weekly plan](./sage-plan-audit/06-sage-plan-signed-in.png): the next
  action, progress, owner split, weekly groups, and upcoming dates read as one
  hierarchy rather than a generic task manager.
- [Task detail after handoff](./sage-plan-audit/07-task-details-handoff.png):
  ownership changes update the plan immediately and remain editable in the
  existing accessible modal pattern.

The current product already has the strongest planning inputs: authenticated
users, hearted schools, a public college catalog, and cached official-source
application deadlines. The missing layer is durable per-user task state.

## Focused first release

The MVP is one active plan per signed-in student with:

- a weekly view centered on overdue work, this week, and up next;
- manual task creation for essays, visits, financial aid, applications, and
  other work;
- one-click import of known deadlines from My Schools;
- student/parent responsibility assignment and reassignment;
- todo, in-progress, done, and skipped states;
- low, medium, high, and urgent priority;
- optional college association, due date, week placement, and notes;
- a task detail editor;
- visible completion progress and the next task needing attention.

The first release intentionally excludes AI-authored plans, calendar sync,
notifications, separate parent accounts, invitation email, file uploads, and
multi-student households. Those are useful later, but none is required to make
the weekly planning loop valuable.

## Planning loop expansion

The next release extends the same workbench without adding AI or new services:

- **Application checklist packs:** a student chooses a saved school and target
  deadline, then Admyt adds ten editable milestones timed backward from that
  date. An imported submission deadline is reused instead of duplicated.
- **Weekly reset:** a student deliberately selects up to five priorities for the
  current week. Unfinished work remains available to carry forward, while tasks
  due this week stay visible regardless of selection.
- **Blockers:** tasks can wait on a parent, counselor, school, or another person,
  and can depend on other tasks. Blocked work remains visible but is omitted
  from the hero's next-action recommendation until it becomes actionable.
- **Application stages:** each saved school moves through Planning, Applying,
  Submitted, Complete, Admitted, Waitlisted, Denied, or Withdrawn. Stage changes
  retire stale application work and add the relevant portal, offer-review, or
  waitlist response step.
- **Financial aid lane:** a student enters the earliest priority deadline and
  chooses saved schools. Admyt adds shared FAFSA preparation once, separates
  student and parent work, and adds three requirement checks per school. Every
  step remains editable and flows through the same weekly plan and blockers.

These behaviors are deterministic and editable. Checklist definitions live in
the Sage Plan client module; only the student's chosen tasks and state are
stored in Supabase.

## Student flow

1. Open Plan from the primary navigation.
2. On first visit, Admyt creates an active plan for the current application
   cycle.
3. Import known dates from My Schools or add a task manually.
4. Review overdue work, this week, and the next few tasks.
5. Open a task to adjust its date, priority, owner, category, school, or notes.
6. Start or complete the task from the weekly list.
7. See progress and the next item update immediately.

The empty state sends students to My Schools when there is nothing to import and
offers a direct Add task action so the experience never depends on generated
data.

## Parent flow

For the MVP, “Parent” is a responsibility lane in the student's plan rather than
a separately authenticated collaborator. A student and parent can review the
plan together, filter mentally by the owner badge, and hand work off by changing
the owner. This supports the core coordination behavior without introducing
invites, household identity, or cross-user RLS before those flows are ready.

A paid collaboration tier can later add plan membership and parent sign-in while
preserving task ownership semantics:

1. Student invites a parent to the existing plan.
2. Parent sees only tasks assigned to them plus shared deadlines and progress.
3. Parent updates their tasks or hands responsibility back.
4. Both people see the same current next action.

## Data model

### `sage_plans`

- `id`: UUID primary key
- `user_id`: owning student's Supabase Auth user ID
- `name`: defaults to “My application plan”
- `application_cycle`: e.g. `2026-2027`
- `status`: `active` or `archived`
- `tier`: `free` or `premium`; reserved now so paid entitlements do not require
  splitting the module later
- `last_weekly_planned_for`: the Monday most recently confirmed in the weekly
  reset
- timestamps

Only one active plan is allowed per user. RLS restricts all access to the owning
user in the MVP.

### `sage_plan_tasks`

- `id`, `plan_id`
- `title`, `notes`
- `category`: `application`, `essay`, `visit`, `financial_aid`, or `other`
- `status`: `todo`, `in_progress`, `done`, or `skipped`
- `priority`: `low`, `medium`, `high`, or `urgent`
- `owner_role`: `student` or `parent`
- `waiting_on`: `none`, `parent`, `counselor`, `school`, or `other`
- `college_id`, `college_name`: optional association; the name is retained as a
  stable display snapshot
- `due_date`: the consequential deadline
- `scheduled_week`: the Monday of the week in which the student plans to work
- `source`: `manual`, `college_deadline`, `application_checklist`,
  `financial_aid_checklist`, `visit_checklist`, or `stage_transition`
- `source_key`: deterministic import key for idempotent deadline imports
- `position`, `completed_at`, timestamps

The task table is the paid-tier seam: future membership can replace or augment
`owner_role` with `owner_member_id` without changing weekly planning behavior.

### `sage_plan_task_dependencies`

- `task_id`
- `depends_on_task_id`
- composite primary key and no-self-dependency check

Dependencies now visibly block downstream work until their prerequisites are
done or skipped. The UI supports multiple prerequisites without exposing a
project-management graph.

### `sage_plan_colleges`

- `plan_id`, `college_id`, and a stable `college_name` display snapshot
- `stage`: the current application lifecycle state
- `application_round` and `target_deadline`: the checklist's working target
- timestamps and one row per college in a plan

Stage rows authorize through the owning plan under RLS, like tasks and
dependencies.

### `sage_plan_events`

- `plan_id`, `college_id`, and stable `college_name` display snapshot
- `event_type`, `format`, `starts_at`, and `time_zone`
- optional location and registration link
- editable questions, follow-up notes, and scheduled/completed/canceled status
- timestamps; generated tasks reference the event through `event_id`

All five tables use explicit Data API grants and RLS. Task, college, event, and dependency
policies authorize through the owning plan, not through client-supplied role or
profile metadata.

## Generated versus manual inputs

Generated or imported from existing Admyt data:

- My Schools supplies the available college associations.
- `college_deadlines` supplies official-source deadline tasks and source links.
- The active application cycle is derived from today's date.
- Imported `source_key` values prevent duplicate tasks across repeated imports.
- Weekly grouping, overdue state, progress, and next attention are computed from
  task state in the browser.

Generated from a deadline the student enters:

- shared StudentAid.gov account, document-gathering, FAFSA submission, summary,
  and state-aid checks;
- school-specific requirement, form, and file-completion checks for each chosen
  school;
- deadline-relative planned weeks, ownership, blockers, and dependencies.

Entered manually:

- essays and supplement milestones;
- campus visits and interviews, including scheduled event details, generated preparation and follow-up tasks, questions to ask, and post-event notes;
- extra scholarships, verification requests, appeals, and financial-aid work
  that falls outside the reusable checklist;
- recommendation, transcript, portfolio, testing, and miscellaneous tasks;
- owner, planned week, notes, priority, and status changes.

No new AI call is required. Sage Plan can use deadline data already gathered by
Admyt, while the student remains in control of the actual work plan.

## Main experience

The page uses a responsive workbench rather than a kanban board:

- A focus bar narrows the weekly work and upcoming-deadline lane to Student,
  Parent, Essays, Financial aid, Overdue, or Waiting. Waiting includes explicit
  outside-party handoffs and unfinished task dependencies. A school selector can
  be combined with any focus without changing or deleting the underlying plan.

- a compact hero names the current week and surfaces the single next action;
- progress cards show completed work, due soon, and owner split;
- the main column groups actionable rows into Needs attention, This week, and Up
  next;
- the side column holds upcoming deadlines and plan controls;
- Add task and task detail use the existing modal and field patterns;
- owner, category, status, priority, and school are readable as compact badges,
  with text labels rather than color alone.

On mobile, Plan becomes a fourth bottom-navigation destination and the side
column folds below the weekly list. Primary actions remain reachable without
horizontal scrolling.

## Implementation plan

1. Add the three-table migration with checks, indexes, grants, and RLS.
2. Add a typed Sage Plan data module for loading, creating, updating, deleting,
   and idempotently importing deadline tasks.
3. Add the `/plan` route, desktop navigation link, and mobile tab.
4. Build the weekly workbench and task editor from existing visual primitives.
5. Include Sage Plan data in account export and confirm account deletion cascades
   from `auth.users` through the plan.
6. Add unit tests for weekly grouping, next-attention selection, progress, and
   deadline import conversion.
7. Verify lint, unit tests, production build, migration reset when local database
   tooling is available, and the rendered desktop/mobile flow.

## Repository conflict check

The working tree already contained unrelated changes in:

- `supabase/functions/chat/prompt.ts`
- `src/lib/deadlinePrompt.test.ts`
- `supabase/.temp/cli-latest`

Sage Plan does not modify the deadline prompt or its test. The CLI temp file is
also left untouched. All implementation changes are isolated to new Sage Plan
files plus the app shell, account export, project context, and shared styles.

## Verification status

- `npm run check`: passed (lint, 30 unit tests, TypeScript, production Vite build)
- Sage Plan helper tests include application, financial-aid, and visit/interview
  checklist timing, ownership, generated questions, and dependency blockers
- focused Sage Plan Playwright flow: passed in Chromium and WebKit, including
  responsibility focus, school focus, clear state, and event/checklist flows
- Supabase migrations are applied and the linked database dry-run reports up to date
- `sage_plan_events` and `sage_plan_colleges` RLS, ownership policies,
  authenticated grants, anonymous denial, and supporting foreign-key indexes
  were verified remotely
- local signed-out desktop and mobile rendering: inspected and accepted
- local signed-in Plan, weekly reset, checklist builders, visit/interview lane,
  task blocker editor, stage controls, and mobile layout were exercised against
  the linked project
- final browser reload produced no current console errors; `design-qa.md` passed
- `npm run db:reset`: remains unavailable because Docker is not running; linked
  migrations and direct verification queries were used instead
- Playwright end-to-end coverage was added for the signed-in handoff flow and
  `/plan` was added to the accessibility route matrix; the CLI suite was not run
  during this browser-led verification pass
