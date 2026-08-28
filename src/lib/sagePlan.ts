import { supabase } from './supabase'
import type { CollegeDeadlines } from './deadlines'

export type SagePlanStatus = 'active' | 'archived'
export type SagePlanTier = 'free' | 'premium'
export type SagePlanTaskCategory = 'application' | 'essay' | 'visit' | 'financial_aid' | 'other'
export type SagePlanTaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped'
export type SagePlanTaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type SagePlanOwnerRole = 'student' | 'parent'
export type SagePlanTaskSource = 'manual' | 'college_deadline' | 'application_checklist' | 'financial_aid_checklist' | 'stage_transition' | 'visit_checklist'
export type SagePlanWaitingOn = 'none' | 'parent' | 'counselor' | 'school' | 'other'
export type SagePlanCollegeStage = 'planning' | 'applying' | 'submitted' | 'complete' | 'admitted' | 'waitlisted' | 'denied' | 'withdrawn'
export type SagePlanEventType = 'campus_tour' | 'virtual_session' | 'open_house' | 'admissions_interview' | 'alumni_interview'
export type SagePlanEventFormat = 'in_person' | 'virtual'
export type SagePlanEventStatus = 'scheduled' | 'completed' | 'canceled'
export type SagePlanFocusMode = 'all' | 'student' | 'parent' | 'essays' | 'financial_aid' | 'overdue' | 'waiting'

export interface SagePlan {
  id: string
  user_id: string
  name: string
  application_cycle: string
  status: SagePlanStatus
  tier: SagePlanTier
  last_weekly_planned_for: string | null
  created_at: string
  updated_at: string
}

export interface SagePlanTask {
  id: string
  plan_id: string
  title: string
  notes: string | null
  category: SagePlanTaskCategory
  status: SagePlanTaskStatus
  priority: SagePlanTaskPriority
  owner_role: SagePlanOwnerRole
  waiting_on: SagePlanWaitingOn
  event_id: string | null
  college_id: string | null
  college_name: string | null
  due_date: string | null
  scheduled_week: string | null
  source: SagePlanTaskSource
  source_key: string | null
  source_url: string | null
  position: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface SagePlanTaskDraft {
  title: string
  notes?: string | null
  category?: SagePlanTaskCategory
  status?: SagePlanTaskStatus
  priority?: SagePlanTaskPriority
  owner_role?: SagePlanOwnerRole
  waiting_on?: SagePlanWaitingOn
  event_id?: string | null
  college_id?: string | null
  college_name?: string | null
  due_date?: string | null
  scheduled_week?: string | null
  source?: SagePlanTaskSource
  source_key?: string | null
  source_url?: string | null
  position?: number
}

export interface SavedSchoolForPlan {
  college_id: string
  college_name: string
}

export interface SagePlanCollege {
  id: string
  plan_id: string
  college_id: string
  college_name: string
  stage: SagePlanCollegeStage
  application_round: string | null
  target_deadline: string | null
  created_at: string
  updated_at: string
}

export interface SagePlanTaskDependency {
  task_id: string
  depends_on_task_id: string
  created_at?: string
}

export interface SagePlanEvent {
  id: string
  plan_id: string
  college_id: string
  college_name: string
  event_type: SagePlanEventType
  format: SagePlanEventFormat
  starts_at: string
  time_zone: string
  location: string | null
  registration_url: string | null
  questions: string[]
  notes: string | null
  status: SagePlanEventStatus
  created_at: string
  updated_at: string
}

export interface SagePlanEventDraft {
  college_id: string
  college_name: string
  event_type: SagePlanEventType
  format: SagePlanEventFormat
  starts_at: string
  time_zone: string
  location?: string | null
  registration_url?: string | null
  questions?: string[]
  notes?: string | null
  status?: SagePlanEventStatus
}

export interface ChecklistTaskDefinition {
  key: string
  dependsOn: string[]
  draft: SagePlanTaskDraft
}

export interface FinancialAidChecklistOptions {
  deadlineDate: string
  schools: SavedSchoolForPlan[]
}

export interface WeeklyTaskGroups {
  needsAttention: SagePlanTask[]
  thisWeek: SagePlanTask[]
  upNext: SagePlanTask[]
}

export interface PlanProgress {
  completed: number
  total: number
  percent: number
  dueSoon: number
  studentOpen: number
  parentOpen: number
}

const PRIORITY_ORDER: Record<SagePlanTaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function parseISODate(iso: string): Date {
  return new Date(`${iso}T12:00:00`)
}

function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return todayISO(date)
}

export function todayISO(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfWeekISO(date = new Date()): string {
  const copy = new Date(date)
  copy.setHours(12, 0, 0, 0)
  const day = copy.getDay()
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1))
  return todayISO(copy)
}

export function endOfWeekISO(date = new Date()): string {
  const monday = parseISODate(startOfWeekISO(date))
  monday.setDate(monday.getDate() + 6)
  return todayISO(monday)
}

export function currentApplicationCycle(date = new Date()): string {
  const year = date.getFullYear()
  const startYear = date.getMonth() >= 6 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

function compareTasks(a: SagePlanTask, b: SagePlanTask): number {
  const aDate = a.due_date ?? '9999-12-31'
  const bDate = b.due_date ?? '9999-12-31'
  return aDate.localeCompare(bDate)
    || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    || a.position - b.position
    || a.created_at.localeCompare(b.created_at)
}

export function groupTasksForWeek(tasks: SagePlanTask[], now = new Date()): WeeklyTaskGroups {
  const today = todayISO(now)
  const weekStart = startOfWeekISO(now)
  const weekEnd = endOfWeekISO(now)
  const actionable = tasks.filter(task => task.status !== 'done' && task.status !== 'skipped')

  const needsAttention = actionable
    .filter(task => (task.due_date != null && task.due_date < today) || task.priority === 'urgent')
    .sort(compareTasks)
  const attentionIds = new Set(needsAttention.map(task => task.id))

  const thisWeek = actionable
    .filter(task => !attentionIds.has(task.id))
    .filter(task => (
      task.scheduled_week === weekStart
      || (task.due_date != null && task.due_date >= today && task.due_date <= weekEnd)
    ))
    .sort(compareTasks)
  const thisWeekIds = new Set(thisWeek.map(task => task.id))

  const upNext = actionable
    .filter(task => !attentionIds.has(task.id) && !thisWeekIds.has(task.id))
    .sort(compareTasks)

  return { needsAttention, thisWeek, upNext }
}

export function nextTaskNeedingAttention(tasks: SagePlanTask[], now = new Date()): SagePlanTask | null {
  const groups = groupTasksForWeek(tasks, now)
  return groups.needsAttention[0] ?? groups.thisWeek[0] ?? groups.upNext[0] ?? null
}

export function calculatePlanProgress(tasks: SagePlanTask[], now = new Date()): PlanProgress {
  const included = tasks.filter(task => task.status !== 'skipped')
  const completed = included.filter(task => task.status === 'done').length
  const open = included.filter(task => task.status !== 'done')
  const today = parseISODate(todayISO(now))
  const soon = new Date(today)
  soon.setDate(soon.getDate() + 14)
  const soonISO = todayISO(soon)

  return {
    completed,
    total: included.length,
    percent: included.length ? Math.round((completed / included.length) * 100) : 0,
    dueSoon: open.filter(task => task.due_date != null && task.due_date <= soonISO).length,
    studentOpen: open.filter(task => task.owner_role === 'student').length,
    parentOpen: open.filter(task => task.owner_role === 'parent').length,
  }
}

export function incompleteDependencyIds(
  taskId: string,
  dependencies: SagePlanTaskDependency[],
  tasks: SagePlanTask[],
): string[] {
  const tasksById = new Map(tasks.map(task => [task.id, task]))
  return dependencies
    .filter(dependency => dependency.task_id === taskId)
    .map(dependency => dependency.depends_on_task_id)
    .filter(dependencyId => {
      const dependency = tasksById.get(dependencyId)
      return dependency != null && dependency.status !== 'done' && dependency.status !== 'skipped'
    })
}

export function filterTasksForFocus(
  tasks: SagePlanTask[],
  dependencies: SagePlanTaskDependency[],
  mode: SagePlanFocusMode,
  collegeId = '',
  now = new Date(),
): SagePlanTask[] {
  const today = todayISO(now)
  const isOpen = (task: SagePlanTask) => task.status !== 'done' && task.status !== 'skipped'

  return tasks.filter(task => {
    if (collegeId && task.college_id !== collegeId) return false
    if (mode === 'student') return task.owner_role === 'student'
    if (mode === 'parent') return task.owner_role === 'parent'
    if (mode === 'essays') return task.category === 'essay'
    if (mode === 'financial_aid') return task.category === 'financial_aid'
    if (mode === 'overdue') return isOpen(task) && task.due_date != null && task.due_date < today
    if (mode === 'waiting') {
      return isOpen(task) && (
        (task.waiting_on ?? 'none') !== 'none'
        || incompleteDependencyIds(task.id, dependencies, tasks).length > 0
      )
    }
    return true
  })
}

export function applicationChecklistFromSchool(
  planId: string,
  school: SavedSchoolForPlan,
  deadlineDate: string,
  applicationRound: string,
): ChecklistTaskDefinition[] {
  const task = (
    key: string,
    title: string,
    dayOffset: number,
    dependsOn: string[] = [],
    overrides: Partial<SagePlanTaskDraft> = {},
  ): ChecklistTaskDefinition => {
    const dueDate = addDaysISO(deadlineDate, dayOffset)
    return {
      key,
      dependsOn,
      draft: {
        title,
        category: 'application',
        status: 'todo',
        priority: dayOffset >= -14 ? 'high' : 'medium',
        owner_role: 'student',
        waiting_on: 'none',
        college_id: school.college_id,
        college_name: school.college_name,
        due_date: dueDate,
        scheduled_week: startOfWeekISO(parseISODate(dueDate)),
        source: 'application_checklist',
        source_key: `checklist:${planId}:${school.college_id}:${deadlineDate}:${key}`,
        ...overrides,
      },
    }
  }

  return [
    task('confirm_requirements', `Confirm ${applicationRound} requirements`, -70),
    task('create_account', 'Create the application account', -63, ['confirm_requirements']),
    task('request_transcript', 'Request the official transcript', -56, ['confirm_requirements']),
    task('ask_recommenders', 'Ask recommenders and share your timeline', -56, ['confirm_requirements']),
    task('draft_essays', 'Draft the school-specific essays', -42, ['confirm_requirements'], { category: 'essay', priority: 'high' }),
    task('review_fees', 'Review the application fee or waiver plan', -28, ['confirm_requirements'], { owner_role: 'parent' }),
    task('confirm_documents', 'Confirm transcript and recommendations are received', -14, ['request_transcript', 'ask_recommenders'], { waiting_on: 'counselor' }),
    task('final_review', 'Complete a final application review', -7, ['create_account', 'draft_essays', 'review_fees', 'confirm_documents'], { priority: 'high' }),
    task('submit_application', `Submit the ${applicationRound} application`, 0, ['final_review'], { priority: 'urgent' }),
    task('verify_portal', 'Check the application portal for missing materials', 3, ['submit_application'], { waiting_on: 'school', priority: 'high' }),
  ]
}

export function financialAidChecklistForPlan(
  planId: string,
  { deadlineDate, schools }: FinancialAidChecklistOptions,
): ChecklistTaskDefinition[] {
  const task = (
    key: string,
    title: string,
    dayOffset: number,
    dependsOn: string[] = [],
    overrides: Partial<SagePlanTaskDraft> = {},
    school?: SavedSchoolForPlan,
  ): ChecklistTaskDefinition => {
    const dueDate = addDaysISO(deadlineDate, dayOffset)
    return {
      key,
      dependsOn,
      draft: {
        title,
        category: 'financial_aid',
        status: 'todo',
        priority: dayOffset >= -14 ? 'high' : 'medium',
        owner_role: 'student',
        waiting_on: 'none',
        college_id: school?.college_id ?? null,
        college_name: school?.college_name ?? null,
        due_date: dueDate,
        scheduled_week: startOfWeekISO(parseISODate(dueDate)),
        source: 'financial_aid_checklist',
        source_key: `aid:${planId}:${school?.college_id ?? 'shared'}:${key}`,
        ...overrides,
      },
    }
  }

  const shared = [
    task('student_fsa_account', 'Create the student StudentAid.gov account', -56),
    task('parent_fsa_account', 'Create the parent StudentAid.gov account', -56, [], { owner_role: 'parent' }),
    task('student_documents', 'Gather the student income and asset details', -49),
    task('parent_documents', 'Gather the parent income and asset details', -49, [], { owner_role: 'parent' }),
    task('school_codes', 'Add every school you may apply to the FAFSA', -35, ['student_fsa_account', 'parent_fsa_account']),
    task('submit_fafsa', 'Complete and submit the FAFSA', -28, [
      'student_fsa_account',
      'parent_fsa_account',
      'student_documents',
      'parent_documents',
      'school_codes',
    ], { priority: 'high' }),
    task('review_summary', 'Review the FAFSA Submission Summary', -21, ['submit_fafsa'], { waiting_on: 'school' }),
    task('state_aid', 'Check state grant and scholarship deadlines', -21),
  ]

  const schoolSpecific = schools.flatMap(school => [
    task(
      `requirements_${school.college_id}`,
      'Confirm financial aid requirements and the priority deadline',
      -42,
      [],
      {},
      school,
    ),
    task(
      `forms_${school.college_id}`,
      'Complete any school-specific aid forms',
      -21,
      [`requirements_${school.college_id}`],
      { owner_role: 'parent' },
      school,
    ),
    task(
      `complete_${school.college_id}`,
      'Confirm the financial aid file is complete',
      -7,
      ['submit_fafsa', `forms_${school.college_id}`],
      { priority: 'high', waiting_on: 'school' },
      school,
    ),
  ])

  return [...shared, ...schoolSpecific]
}

export function suggestedEventQuestions(eventType: SagePlanEventType): string[] {
  if (eventType === 'admissions_interview' || eventType === 'alumni_interview') {
    return [
      'What surprised you most about this school?',
      'What kind of student thrives here?',
      'How does the school support students who are still exploring majors?',
    ]
  }
  return [
    'What do students wish they knew before enrolling?',
    'How easy is it to get the classes you want in your intended major?',
    'What do students usually do on weekends?',
  ]
}

export function eventChecklistForPlan(
  planId: string,
  eventId: string,
  event: SagePlanEventDraft,
  now = new Date(),
): ChecklistTaskDefinition[] {
  const eventDate = todayISO(new Date(event.starts_at))
  const today = todayISO(now)
  const due = (offset: number) => {
    const calculated = addDaysISO(eventDate, offset)
    return offset < 0 && calculated < today ? today : calculated
  }
  const task = (
    key: string,
    title: string,
    offset: number,
    dependsOn: string[] = [],
    overrides: Partial<SagePlanTaskDraft> = {},
  ): ChecklistTaskDefinition => {
    const dueDate = due(offset)
    return {
      key,
      dependsOn,
      draft: {
        title,
        category: 'visit',
        status: 'todo',
        priority: offset >= -3 ? 'high' : 'medium',
        owner_role: 'student',
        waiting_on: 'none',
        event_id: eventId,
        college_id: event.college_id,
        college_name: event.college_name,
        due_date: dueDate,
        scheduled_week: startOfWeekISO(parseISODate(dueDate)),
        source: 'visit_checklist',
        source_key: `event:${planId}:${eventId}:${key}`,
        ...overrides,
      },
    }
  }

  const isInterview = event.event_type === 'admissions_interview' || event.event_type === 'alumni_interview'
  const logisticsOwner: SagePlanOwnerRole = event.format === 'in_person' ? 'parent' : 'student'
  const preparation = isInterview
    ? task('prepare', 'Prepare “Why this school?” and two personal stories', -3, ['confirm'])
    : task('prepare', 'Choose the programs and places you want to explore', -3, ['confirm'])

  return [
    task('confirm', 'Register or confirm the event', -14),
    task('logistics', event.format === 'in_person' ? 'Confirm travel, parking, and arrival details' : 'Confirm the meeting link and technology', -7, ['confirm'], { owner_role: logisticsOwner }),
    preparation,
    task('questions', 'Write three questions you want answered', -2, ['prepare']),
    task('attend', isInterview ? 'Attend the interview' : 'Attend the visit', 0, ['logistics', 'questions'], { priority: 'urgent' }),
    task('impressions', 'Capture your immediate impressions', 0, ['attend']),
    ...(isInterview ? [task('thank_you', 'Send a thank-you note', 1, ['attend'])] : []),
  ]
}

export function deadlineTasksFromSchools(
  planId: string,
  schools: SavedSchoolForPlan[],
  deadlinesByCollege: Record<string, CollegeDeadlines>,
  now = new Date(),
): SagePlanTaskDraft[] {
  return schools.flatMap(school => {
    const deadlines = deadlinesByCollege[school.college_id]
    if (!deadlines) return []
    const today = todayISO(now)
    return (deadlines.rounds ?? []).filter(round => round.date >= today).map(round => ({
      title: `Submit ${round.type} application`,
      category: 'application' as const,
      status: 'todo' as const,
      priority: 'high' as const,
      owner_role: 'student' as const,
      college_id: school.college_id,
      college_name: school.college_name,
      due_date: round.date,
      scheduled_week: startOfWeekISO(parseISODate(round.date)),
      source: 'college_deadline' as const,
      source_key: `deadline:${planId}:${school.college_id}:${round.type}:${round.date}`,
      source_url: deadlines.source_url ?? null,
    }))
  })
}

export async function getOrCreateActivePlan(userId: string): Promise<SagePlan> {
  const existing = await supabase
    .from('sage_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (existing.data) return existing.data as SagePlan

  const created = await supabase
    .from('sage_plans')
    .insert({ user_id: userId, application_cycle: currentApplicationCycle() })
    .select('*')
    .single()
  if (!created.error && created.data) return created.data as SagePlan

  // A second tab may have created the unique active plan between the read and
  // insert. Re-read once so that harmless race does not become an error state.
  const raced = await supabase
    .from('sage_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  if (raced.error || !raced.data) throw new Error(created.error?.message ?? raced.error?.message ?? 'Could not create plan')
  return raced.data as SagePlan
}

export async function loadPlanTasks(planId: string): Promise<SagePlanTask[]> {
  const { data, error } = await supabase
    .from('sage_plan_tasks')
    .select('*')
    .eq('plan_id', planId)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('position', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as SagePlanTask[]
}

export async function loadPlanEvents(planId: string): Promise<SagePlanEvent[]> {
  const { data, error } = await supabase
    .from('sage_plan_events')
    .select('*')
    .eq('plan_id', planId)
    .order('starts_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as SagePlanEvent[]
}

export async function createPlanEventWithChecklist(
  planId: string,
  draft: SagePlanEventDraft,
): Promise<{ event: SagePlanEvent; tasks: SagePlanTask[] }> {
  const eventResult = await supabase
    .from('sage_plan_events')
    .insert({
      plan_id: planId,
      ...draft,
      college_name: draft.college_name.trim(),
      location: draft.location?.trim() || null,
      registration_url: draft.registration_url?.trim() || null,
      questions: draft.questions?.map(question => question.trim()).filter(Boolean) ?? suggestedEventQuestions(draft.event_type),
      notes: draft.notes?.trim() || null,
    })
    .select('*')
    .single()
  if (eventResult.error || !eventResult.data) throw new Error(eventResult.error?.message ?? 'Could not add event')
  const event = eventResult.data as SagePlanEvent

  try {
    const definitions = eventChecklistForPlan(planId, event.id, draft)
    const taskResult = await supabase
      .from('sage_plan_tasks')
      .insert(definitions.map(definition => ({ plan_id: planId, ...definition.draft })))
      .select('*')
    if (taskResult.error) throw new Error(taskResult.error.message)
    const tasks = (taskResult.data ?? []) as SagePlanTask[]
    const taskIdByKey = new Map(definitions.map(definition => [
      definition.key,
      tasks.find(task => task.source_key === definition.draft.source_key)?.id,
    ]))
    const dependencyRows = definitions.flatMap(definition => {
      const taskId = taskIdByKey.get(definition.key)
      if (!taskId) return []
      return definition.dependsOn.flatMap(key => {
        const dependsOnTaskId = taskIdByKey.get(key)
        return dependsOnTaskId ? [{ task_id: taskId, depends_on_task_id: dependsOnTaskId }] : []
      })
    })
    if (dependencyRows.length) {
      const dependencyResult = await supabase.from('sage_plan_task_dependencies').insert(dependencyRows)
      if (dependencyResult.error) throw new Error(dependencyResult.error.message)
    }
    return { event, tasks }
  } catch (error) {
    await supabase.from('sage_plan_events').delete().eq('id', event.id)
    throw error
  }
}

export async function updatePlanEvent(
  eventId: string,
  update: Partial<Pick<SagePlanEvent, 'questions' | 'notes' | 'status' | 'location' | 'registration_url'>>,
): Promise<SagePlanEvent> {
  const payload: Record<string, unknown> = { ...update, updated_at: new Date().toISOString() }
  if ('notes' in update) payload.notes = update.notes?.trim() || null
  if ('location' in update) payload.location = update.location?.trim() || null
  if ('registration_url' in update) payload.registration_url = update.registration_url?.trim() || null
  if (update.questions) payload.questions = update.questions.map(question => question.trim()).filter(Boolean)
  const { data, error } = await supabase
    .from('sage_plan_events')
    .update(payload)
    .eq('id', eventId)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Could not update event')

  if (update.status === 'canceled') {
    const skipped = await supabase
      .from('sage_plan_tasks')
      .update({ status: 'skipped', completed_at: null, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .in('status', ['todo', 'in_progress'])
    if (skipped.error) throw new Error(skipped.error.message)
  }
  return data as SagePlanEvent
}

export async function createPlanTask(planId: string, draft: SagePlanTaskDraft): Promise<SagePlanTask> {
  const status = draft.status ?? 'todo'
  const { data, error } = await supabase
    .from('sage_plan_tasks')
    .insert({
      plan_id: planId,
      ...draft,
      title: draft.title.trim(),
      notes: draft.notes?.trim() || null,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    })
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Could not create task')
  return data as SagePlanTask
}

export async function updatePlanTask(taskId: string, update: Partial<SagePlanTaskDraft>): Promise<SagePlanTask> {
  const payload: Record<string, unknown> = { ...update, updated_at: new Date().toISOString() }
  if (typeof update.title === 'string') payload.title = update.title.trim()
  if ('notes' in update) payload.notes = update.notes?.trim() || null
  if (update.status === 'done') payload.completed_at = new Date().toISOString()
  if (update.status && update.status !== 'done') payload.completed_at = null

  const { data, error } = await supabase
    .from('sage_plan_tasks')
    .update(payload)
    .eq('id', taskId)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Could not update task')
  return data as SagePlanTask
}

export async function deletePlanTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('sage_plan_tasks').delete().eq('id', taskId)
  if (error) throw new Error(error.message)
}

export async function importDeadlineTasks(
  planId: string,
  schools: SavedSchoolForPlan[],
  deadlinesByCollege: Record<string, CollegeDeadlines>,
): Promise<SagePlanTask[]> {
  const drafts = deadlineTasksFromSchools(planId, schools, deadlinesByCollege)
  if (!drafts.length) return []

  const sourceKeys = drafts.map(draft => draft.source_key).filter((value): value is string => !!value)
  const existing = await supabase
    .from('sage_plan_tasks')
    .select('source_key')
    .eq('plan_id', planId)
    .in('source_key', sourceKeys)
  if (existing.error) throw new Error(existing.error.message)
  const existingKeys = new Set((existing.data ?? []).map(row => String(row.source_key)))
  const newDrafts = drafts.filter(draft => draft.source_key && !existingKeys.has(draft.source_key))
  if (!newDrafts.length) return []

  const { data, error } = await supabase
    .from('sage_plan_tasks')
    .insert(newDrafts.map(draft => ({ plan_id: planId, ...draft })))
    .select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as SagePlanTask[]
}

export async function loadPlanDependencies(taskIds: string[]): Promise<SagePlanTaskDependency[]> {
  if (!taskIds.length) return []
  const { data, error } = await supabase
    .from('sage_plan_task_dependencies')
    .select('task_id,depends_on_task_id,created_at')
    .in('task_id', taskIds)
  if (error) throw new Error(error.message)
  return (data ?? []) as SagePlanTaskDependency[]
}

export async function replaceTaskDependencies(taskId: string, dependencyIds: string[]): Promise<SagePlanTaskDependency[]> {
  const uniqueIds = [...new Set(dependencyIds)].filter(id => id !== taskId)
  const removed = await supabase.from('sage_plan_task_dependencies').delete().eq('task_id', taskId)
  if (removed.error) throw new Error(removed.error.message)
  if (!uniqueIds.length) return []

  const { data, error } = await supabase
    .from('sage_plan_task_dependencies')
    .insert(uniqueIds.map(depends_on_task_id => ({ task_id: taskId, depends_on_task_id })))
    .select('task_id,depends_on_task_id,created_at')
  if (error) throw new Error(error.message)
  return (data ?? []) as SagePlanTaskDependency[]
}

export async function syncPlanColleges(planId: string, schools: SavedSchoolForPlan[]): Promise<SagePlanCollege[]> {
  if (schools.length) {
    const { error } = await supabase.from('sage_plan_colleges').upsert(
      schools.map(school => ({
        plan_id: planId,
        college_id: school.college_id,
        college_name: school.college_name,
      })),
      { onConflict: 'plan_id,college_id' },
    )
    if (error) throw new Error(error.message)
  }
  return loadPlanColleges(planId)
}

export async function loadPlanColleges(planId: string): Promise<SagePlanCollege[]> {
  const { data, error } = await supabase
    .from('sage_plan_colleges')
    .select('*')
    .eq('plan_id', planId)
    .order('college_name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as SagePlanCollege[]
}

export async function updatePlanCollege(
  collegeId: string,
  update: Partial<Pick<SagePlanCollege, 'stage' | 'application_round' | 'target_deadline'>>,
): Promise<SagePlanCollege> {
  const { data, error } = await supabase
    .from('sage_plan_colleges')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', collegeId)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Could not update college stage')
  return data as SagePlanCollege
}

export async function saveWeeklyPlan(
  planId: string,
  tasks: SagePlanTask[],
  selectedTaskIds: string[],
  weekStart = startOfWeekISO(),
): Promise<SagePlanTask[]> {
  const selected = new Set(selectedTaskIds)
  const toRemove = tasks
    .filter(task => task.scheduled_week === weekStart && !selected.has(task.id))
    .map(task => task.id)
  if (toRemove.length) {
    const { error } = await supabase
      .from('sage_plan_tasks')
      .update({ scheduled_week: null, updated_at: new Date().toISOString() })
      .in('id', toRemove)
    if (error) throw new Error(error.message)
  }
  if (selectedTaskIds.length) {
    const { error } = await supabase
      .from('sage_plan_tasks')
      .update({ scheduled_week: weekStart, updated_at: new Date().toISOString() })
      .in('id', selectedTaskIds)
    if (error) throw new Error(error.message)
  }
  const planUpdate = await supabase
    .from('sage_plans')
    .update({ last_weekly_planned_for: weekStart, updated_at: new Date().toISOString() })
    .eq('id', planId)
  if (planUpdate.error) throw new Error(planUpdate.error.message)
  return loadPlanTasks(planId)
}

export async function importApplicationChecklist(
  planId: string,
  school: SavedSchoolForPlan,
  deadlineDate: string,
  applicationRound: string,
): Promise<SagePlanTask[]> {
  const definitions = applicationChecklistFromSchool(planId, school, deadlineDate, applicationRound)
  const { data: existingData, error: existingError } = await supabase
    .from('sage_plan_tasks')
    .select('*')
    .eq('plan_id', planId)
    .eq('college_id', school.college_id)
  if (existingError) throw new Error(existingError.message)
  const existing = (existingData ?? []) as SagePlanTask[]
  const existingBySourceKey = new Map(existing.filter(task => task.source_key).map(task => [task.source_key as string, task]))
  const importedDeadline = existing.find(task => task.source === 'college_deadline' && task.due_date === deadlineDate)
  const toInsert = definitions
    .filter(definition => !(definition.key === 'submit_application' && importedDeadline))
    .filter(definition => !existingBySourceKey.has(definition.draft.source_key ?? ''))

  let inserted: SagePlanTask[] = []
  if (toInsert.length) {
    const result = await supabase
      .from('sage_plan_tasks')
      .insert(toInsert.map(definition => ({ plan_id: planId, ...definition.draft })))
      .select('*')
    if (result.error) throw new Error(result.error.message)
    inserted = (result.data ?? []) as SagePlanTask[]
  }

  const allTasks = [...existing, ...inserted]
  const idByKey = new Map<string, string>()
  for (const definition of definitions) {
    if (definition.key === 'submit_application' && importedDeadline) {
      idByKey.set(definition.key, importedDeadline.id)
      continue
    }
    const matched = allTasks.find(task => task.source_key === definition.draft.source_key)
    if (matched) idByKey.set(definition.key, matched.id)
  }
  const dependencyRows = definitions.flatMap(definition => {
    const taskId = idByKey.get(definition.key)
    if (!taskId) return []
    return definition.dependsOn.flatMap(dependencyKey => {
      const dependsOnTaskId = idByKey.get(dependencyKey)
      return dependsOnTaskId ? [{ task_id: taskId, depends_on_task_id: dependsOnTaskId }] : []
    })
  })
  if (dependencyRows.length) {
    const dependencyResult = await supabase
      .from('sage_plan_task_dependencies')
      .upsert(dependencyRows, { onConflict: 'task_id,depends_on_task_id', ignoreDuplicates: true })
    if (dependencyResult.error) throw new Error(dependencyResult.error.message)
  }

  const planColleges = await syncPlanColleges(planId, [school])
  const planCollege = planColleges.find(college => college.college_id === school.college_id)
  if (planCollege) {
    await updatePlanCollege(planCollege.id, {
      stage: planCollege.stage === 'planning' ? 'applying' : planCollege.stage,
      application_round: applicationRound,
      target_deadline: deadlineDate,
    })
  }
  return inserted
}

export async function importFinancialAidChecklist(
  planId: string,
  options: FinancialAidChecklistOptions,
): Promise<SagePlanTask[]> {
  const definitions = financialAidChecklistForPlan(planId, options)
  const sourceKeys = definitions.map(definition => definition.draft.source_key as string)
  const { data: existingData, error: existingError } = await supabase
    .from('sage_plan_tasks')
    .select('*')
    .eq('plan_id', planId)
    .in('source_key', sourceKeys)
  if (existingError) throw new Error(existingError.message)

  const existing = (existingData ?? []) as SagePlanTask[]
  const existingBySourceKey = new Map(existing.map(task => [task.source_key as string, task]))
  const toInsert = definitions.filter(definition => !existingBySourceKey.has(definition.draft.source_key as string))
  let inserted: SagePlanTask[] = []
  if (toInsert.length) {
    const result = await supabase
      .from('sage_plan_tasks')
      .insert(toInsert.map(definition => ({ plan_id: planId, ...definition.draft })))
      .select('*')
    if (result.error) throw new Error(result.error.message)
    inserted = (result.data ?? []) as SagePlanTask[]
  }

  await Promise.all(definitions.flatMap(definition => {
    const matched = existingBySourceKey.get(definition.draft.source_key as string)
    if (!matched || matched.status === 'done' || matched.status === 'skipped') return []
    return [updatePlanTask(matched.id, {
      due_date: definition.draft.due_date,
      scheduled_week: definition.draft.scheduled_week,
    })]
  }))

  const allTasks = [...existing, ...inserted]
  const idByKey = new Map<string, string>()
  for (const definition of definitions) {
    const matched = allTasks.find(task => task.source_key === definition.draft.source_key)
    if (matched) idByKey.set(definition.key, matched.id)
  }
  const dependencyRows = definitions.flatMap(definition => {
    const taskId = idByKey.get(definition.key)
    if (!taskId) return []
    return definition.dependsOn.flatMap(dependencyKey => {
      const dependsOnTaskId = idByKey.get(dependencyKey)
      return dependsOnTaskId ? [{ task_id: taskId, depends_on_task_id: dependsOnTaskId }] : []
    })
  })
  if (dependencyRows.length) {
    const dependencyResult = await supabase
      .from('sage_plan_task_dependencies')
      .upsert(dependencyRows, { onConflict: 'task_id,depends_on_task_id', ignoreDuplicates: true })
    if (dependencyResult.error) throw new Error(dependencyResult.error.message)
  }

  return inserted
}

async function createStageTaskIfMissing(planId: string, draft: SagePlanTaskDraft): Promise<void> {
  if (!draft.source_key) return
  const existing = await supabase
    .from('sage_plan_tasks')
    .select('id')
    .eq('plan_id', planId)
    .eq('source_key', draft.source_key)
    .maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (!existing.data) await createPlanTask(planId, draft)
}

export async function applyCollegeStageTransition(
  planId: string,
  college: SagePlanCollege,
  stage: SagePlanCollegeStage,
  tasks: SagePlanTask[],
  now = new Date(),
): Promise<{ college: SagePlanCollege; tasks: SagePlanTask[] }> {
  const updatedCollege = await updatePlanCollege(college.id, { stage })
  const collegeTasks = tasks.filter(task => task.college_id === college.college_id)
  const openTasks = collegeTasks.filter(task => task.status !== 'done' && task.status !== 'skipped')

  if (stage === 'submitted') {
    await Promise.all(openTasks.map(task => {
      if (task.source === 'college_deadline') return updatePlanTask(task.id, { status: 'done' })
      if (task.source === 'application_checklist' && !task.source_key?.endsWith(':verify_portal')) {
        return updatePlanTask(task.id, { status: 'skipped' })
      }
      return Promise.resolve(task)
    }))
    await createStageTaskIfMissing(planId, {
      title: 'Check the application portal for missing materials',
      category: 'application',
      priority: 'high',
      owner_role: 'student',
      waiting_on: 'school',
      college_id: college.college_id,
      college_name: college.college_name,
      due_date: todayISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3)),
      scheduled_week: startOfWeekISO(now),
      source: 'stage_transition',
      source_key: `stage:${planId}:${college.college_id}:submitted:portal`,
    })
  }

  if (stage === 'complete' || stage === 'denied' || stage === 'withdrawn') {
    await Promise.all(openTasks.map(task => updatePlanTask(task.id, { status: 'skipped' })))
  }

  if (stage === 'admitted') {
    await createStageTaskIfMissing(planId, {
      title: 'Review the admission offer and financial aid package',
      category: 'financial_aid',
      priority: 'high',
      owner_role: 'student',
      waiting_on: 'none',
      college_id: college.college_id,
      college_name: college.college_name,
      due_date: todayISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)),
      scheduled_week: startOfWeekISO(now),
      source: 'stage_transition',
      source_key: `stage:${planId}:${college.college_id}:admitted:offer`,
    })
  }

  if (stage === 'waitlisted') {
    await createStageTaskIfMissing(planId, {
      title: 'Review the waitlist response options',
      category: 'application',
      priority: 'high',
      owner_role: 'student',
      waiting_on: 'none',
      college_id: college.college_id,
      college_name: college.college_name,
      due_date: todayISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5)),
      scheduled_week: startOfWeekISO(now),
      source: 'stage_transition',
      source_key: `stage:${planId}:${college.college_id}:waitlisted:response`,
    })
  }

  return { college: updatedCollege, tasks: await loadPlanTasks(planId) }
}
