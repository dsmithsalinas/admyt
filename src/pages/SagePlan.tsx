import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  ExternalLink,
  GitBranch,
  ListChecks,
  ListFilter,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import AuthModal from '@/components/ui/AuthModal'
import Modal from '@/components/ui/Modal'
import SageOrb from '@/components/sage/SageOrb'
import { ChecklistBuilder, CollegeStagesCard, FinancialAidBuilder, FinancialAidCard, FinancialAidReview, WeeklyPlanner } from '@/components/plan/SagePlanEnhancements'
import { PlanFocusBar } from '@/components/plan/PlanFocusBar'
import { VisitInterviewBuilder, VisitInterviewCard, VisitInterviewDetail } from '@/components/plan/VisitInterviewLane'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDeadlineDate, getCachedDeadlines, type CollegeDeadlines } from '@/lib/deadlines'
import {
  calculatePlanProgress,
  createPlanTask,
  createPlanEventWithChecklist,
  currentApplicationCycle,
  deletePlanTask,
  filterTasksForFocus,
  getOrCreateActivePlan,
  groupTasksForWeek,
  importApplicationChecklist,
  importFinancialAidChecklist,
  importDeadlineTasks,
  incompleteDependencyIds,
  loadPlanDependencies,
  loadPlanEvents,
  loadPlanTasks,
  nextTaskNeedingAttention,
  replaceTaskDependencies,
  saveWeeklyPlan,
  startOfWeekISO,
  syncPlanColleges,
  applyCollegeStageTransition,
  updatePlanTask,
  updatePlanEvent,
  type SagePlan as SagePlanRecord,
  type SagePlanCollege,
  type SagePlanCollegeStage,
  type SagePlanEvent,
  type SagePlanEventDraft,
  type SagePlanEventStatus,
  type SagePlanFocusMode,
  type SagePlanOwnerRole,
  type SagePlanTask,
  type SagePlanTaskCategory,
  type SagePlanTaskDraft,
  type SagePlanTaskPriority,
  type SagePlanTaskDependency,
  type SagePlanTaskStatus,
  type SagePlanWaitingOn,
  type SavedSchoolForPlan,
} from '@/lib/sagePlan'

const CATEGORY_LABELS: Record<SagePlanTaskCategory, string> = {
  application: 'Application',
  essay: 'Essay',
  visit: 'Campus visit',
  financial_aid: 'Financial aid',
  other: 'Other',
}

const PRIORITY_LABELS: Record<SagePlanTaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

const WAITING_ON_LABELS: Record<SagePlanWaitingOn, string> = {
  none: 'No one',
  parent: 'Parent',
  counselor: 'Counselor',
  school: 'School',
  other: 'Someone else',
}

function weekLabel(date = new Date()) {
  const start = new Date(`${startOfWeekISO(date)}T12:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const startText = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endText = end.toLocaleDateString('en-US', { month: start.getMonth() === end.getMonth() ? undefined : 'short', day: 'numeric' })
  return `${startText}–${endText}`
}

function relativeDue(date: string | null) {
  if (!date) return 'No due date'
  const due = new Date(`${date}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days <= 14) return `Due in ${days}d`
  return formatDeadlineDate(date)
}

function TaskRow({
  task,
  tasks,
  dependencies,
  onOpen,
  onStatus,
  onHandoff,
}: {
  task: SagePlanTask
  tasks: SagePlanTask[]
  dependencies: SagePlanTaskDependency[]
  onOpen: () => void
  onStatus: (status: SagePlanTaskStatus) => void
  onHandoff: () => void
}) {
  const isDone = task.status === 'done'
  const ownerLabel = task.owner_role === 'student' ? 'Student' : 'Parent'
  const dependencyBlockers = incompleteDependencyIds(task.id, dependencies, tasks)
  const waitingOn = task.waiting_on ?? 'none'
  const isBlocked = !isDone && (dependencyBlockers.length > 0 || waitingOn !== 'none')
  const blockerLabel = dependencyBlockers.length
    ? `Blocked by ${dependencyBlockers.length} task${dependencyBlockers.length === 1 ? '' : 's'}`
    : waitingOn !== 'none' ? `Waiting on ${WAITING_ON_LABELS[waitingOn].toLowerCase()}` : ''
  return (
    <article className={`plan-task-row${isDone ? ' is-done' : ''}${isBlocked ? ' is-blocked' : ''}`}>
      <button
        className="plan-task-check"
        aria-label={isDone ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
        aria-pressed={isDone}
        onClick={() => onStatus(isDone ? 'todo' : 'done')}
      >
        {isDone && <Check size={16} aria-hidden="true" />}
      </button>
      <button className="plan-task-main" onClick={onOpen}>
        <span className="plan-task-title">{task.title}</span>
        <span className="plan-task-meta">
          {task.college_name && <span>{task.college_name}</span>}
          <span>{CATEGORY_LABELS[task.category]}</span>
          <span className={task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && !isDone ? 'is-overdue' : ''}>
            {relativeDue(task.due_date)}
          </span>
          {isBlocked && <span className="plan-task-blocker"><GitBranch size={11} aria-hidden="true" /> {blockerLabel}</span>}
        </span>
      </button>
      <div className="plan-task-actions">
        <button
          className={`plan-owner-chip ${task.owner_role}`}
          onClick={onHandoff}
          aria-label={`Assigned to ${ownerLabel}. Hand off to ${task.owner_role === 'student' ? 'Parent' : 'Student'}`}
          title="Hand off responsibility"
        >
          {task.owner_role === 'student' ? <UserRound size={13} aria-hidden="true" /> : <UsersRound size={13} aria-hidden="true" />}
          {ownerLabel}
          <ArrowRightLeft size={11} aria-hidden="true" />
        </button>
        {task.status === 'todo' && !isBlocked && (
          <button className="pill plan-start-button" onClick={() => onStatus('in_progress')}>Start</button>
        )}
        {task.status === 'todo' && isBlocked && <span className="pill amber">Blocked</span>}
        {task.status === 'in_progress' && <span className="pill teal">In progress</span>}
        <ChevronRight size={17} aria-hidden="true" className="plan-task-chevron" />
      </div>
    </article>
  )
}

function TaskGroup({
  title,
  description,
  tasks,
  allTasks,
  dependencies,
  tone,
  onOpen,
  onStatus,
  onHandoff,
}: {
  title: string
  description: string
  tasks: SagePlanTask[]
  allTasks: SagePlanTask[]
  dependencies: SagePlanTaskDependency[]
  tone?: 'attention'
  onOpen: (task: SagePlanTask) => void
  onStatus: (task: SagePlanTask, status: SagePlanTaskStatus) => void
  onHandoff: (task: SagePlanTask) => void
}) {
  if (!tasks.length) return null
  return (
    <section className={`plan-task-group${tone ? ` ${tone}` : ''}`}>
      <div className="plan-section-heading">
        <div>
          <h2>{tone === 'attention' && <AlertTriangle size={17} aria-hidden="true" />}{title}</h2>
          <p>{description}</p>
        </div>
        <span className="pill">{tasks.length}</span>
      </div>
      <div className="plan-task-list">
        {tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            tasks={allTasks}
            dependencies={dependencies}
            onOpen={() => onOpen(task)}
            onStatus={status => onStatus(task, status)}
            onHandoff={() => onHandoff(task)}
          />
        ))}
      </div>
    </section>
  )
}

function TaskEditor({
  task,
  tasks,
  dependencies,
  schools,
  onClose,
  onSave,
  onDelete,
}: {
  task: SagePlanTask | null
  tasks: SagePlanTask[]
  dependencies: SagePlanTaskDependency[]
  schools: SavedSchoolForPlan[]
  onClose: () => void
  onSave: (draft: SagePlanTaskDraft, dependencyIds: string[]) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [category, setCategory] = useState<SagePlanTaskCategory>(task?.category ?? 'other')
  const [priority, setPriority] = useState<SagePlanTaskPriority>(task?.priority ?? 'medium')
  const [owner, setOwner] = useState<SagePlanOwnerRole>(task?.owner_role ?? 'student')
  const [waitingOn, setWaitingOn] = useState<SagePlanWaitingOn>(task?.waiting_on ?? 'none')
  const [status, setStatus] = useState<SagePlanTaskStatus>(task?.status ?? 'todo')
  const [collegeId, setCollegeId] = useState(task?.college_id ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [scheduledWeek, setScheduledWeek] = useState(task?.scheduled_week ?? startOfWeekISO())
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [dependencyIds, setDependencyIds] = useState(() => new Set(
    dependencies.filter(dependency => dependency.task_id === task?.id).map(dependency => dependency.depends_on_task_id),
  ))

  const selectedSchool = schools.find(school => school.college_id === collegeId)

  async function save() {
    if (!title.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      await onSave({
        title,
        notes,
        category,
        priority,
        owner_role: owner,
        waiting_on: waitingOn,
        status,
        college_id: collegeId || null,
        college_name: selectedSchool?.college_name ?? task?.college_name ?? null,
        due_date: dueDate || null,
        scheduled_week: scheduledWeek ? startOfWeekISO(new Date(`${scheduledWeek}T12:00:00`)) : null,
      }, [...dependencyIds])
    } catch {
      setError('That task didn’t save. Nothing was lost—try again.')
      setSaving(false)
    }
  }

  async function remove() {
    if (!onDelete || saving) return
    setSaving(true)
    setError('')
    try {
      await onDelete()
    } catch {
      setError('That task didn’t delete. Try again.')
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="plan-task-editor-title" panelStyle={{ maxWidth: 620, padding: 0, maxHeight: '88vh' }}>
      <div className="frame-head">
        <div>
          <span className="mini-title">{task ? 'Task details' : 'New task'}</span>
          <h2 id="plan-task-editor-title" style={{ margin: '5px 0 0', fontSize: 22, color: 'var(--admyt-ink)' }}>
            {task ? 'Keep the plan current' : 'What needs to happen?'}
          </h2>
        </div>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      <div className="plan-task-form">
        <label className="plan-field plan-field-wide">
          Task
          <input className="field" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} autoFocus placeholder="e.g. Draft the community essay" />
        </label>
        <label className="plan-field">
          Owner
          <select className="field" value={owner} onChange={event => setOwner(event.target.value as SagePlanOwnerRole)}>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </label>
        <label className="plan-field">
          Status
          <select className="field" value={status} onChange={event => setStatus(event.target.value as SagePlanTaskStatus)}>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
            <option value="skipped">Skipped</option>
          </select>
        </label>
        <label className="plan-field">
          Waiting on
          <select className="field" value={waitingOn} onChange={event => setWaitingOn(event.target.value as SagePlanWaitingOn)}>
            {Object.entries(WAITING_ON_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
          <small>Use this when progress depends on someone outside the plan.</small>
        </label>
        <label className="plan-field">
          Category
          <select className="field" value={category} onChange={event => setCategory(event.target.value as SagePlanTaskCategory)}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="plan-field">
          Priority
          <select className="field" value={priority} onChange={event => setPriority(event.target.value as SagePlanTaskPriority)}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="plan-field">
          Due date
          <input className="field" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} />
        </label>
        <label className="plan-field">
          Planned week
          <input className="field" type="date" value={scheduledWeek} onChange={event => setScheduledWeek(event.target.value)} />
          <small>Any date works. We’ll place it in that week.</small>
        </label>
        <label className="plan-field plan-field-wide">
          School
          <select className="field" value={collegeId} onChange={event => setCollegeId(event.target.value)}>
            <option value="">No school</option>
            {schools.map(school => <option value={school.college_id} key={school.college_id}>{school.college_name}</option>)}
          </select>
        </label>
        <label className="plan-field plan-field-wide">
          Notes
          <textarea className="field" value={notes} onChange={event => setNotes(event.target.value)} maxLength={4000} rows={4} placeholder="Links, requirements, or the next tiny step" />
        </label>
        <fieldset className="plan-field plan-field-wide plan-dependency-picker">
          <legend>Blocked by</legend>
          <small>Choose any tasks that need to be finished first.</small>
          <div>
            {tasks.filter(candidate => candidate.id !== task?.id && candidate.status !== 'skipped').length ? tasks
              .filter(candidate => candidate.id !== task?.id && candidate.status !== 'skipped')
              .map(candidate => (
                <label key={candidate.id}>
                  <input
                    type="checkbox"
                    checked={dependencyIds.has(candidate.id)}
                    onChange={() => setDependencyIds(current => {
                      const next = new Set(current)
                      if (next.has(candidate.id)) next.delete(candidate.id)
                      else next.add(candidate.id)
                      return next
                    })}
                  />
                  <span>{candidate.title}</span>
                  {candidate.college_name && <small>{candidate.college_name}</small>}
                </label>
              )) : <p>No other tasks are available yet.</p>}
          </div>
        </fieldset>
        {error && <p className="form-error plan-field-wide" role="alert">{error}</p>}
        <div className="plan-form-actions plan-field-wide">
          {task && onDelete ? (
            confirmDelete ? (
              <div className="plan-delete-confirm">
                <span>Remove this task?</span>
                <button className="btn secondary" onClick={() => setConfirmDelete(false)} disabled={saving}>Cancel</button>
                <button className="btn danger" onClick={() => void remove()} disabled={saving}>{saving ? 'Removing…' : 'Remove'}</button>
              </div>
            ) : (
              <button className="btn secondary" onClick={() => setConfirmDelete(true)} disabled={saving}>
                <Trash2 size={15} aria-hidden="true" /> Remove task
              </button>
            )
          ) : <span />}
          <button className="btn" onClick={() => void save()} disabled={!title.trim() || saving}>
            {saving ? 'Saving…' : task ? 'Save changes' : 'Add to plan'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function SagePlan() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [plan, setPlan] = useState<SagePlanRecord | null>(null)
  const [tasks, setTasks] = useState<SagePlanTask[]>([])
  const [dependencies, setDependencies] = useState<SagePlanTaskDependency[]>([])
  const [schools, setSchools] = useState<SavedSchoolForPlan[]>([])
  const [planColleges, setPlanColleges] = useState<SagePlanCollege[]>([])
  const [events, setEvents] = useState<SagePlanEvent[]>([])
  const [deadlines, setDeadlines] = useState<Record<string, CollegeDeadlines>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<SagePlanTask | null>(null)
  const [importing, setImporting] = useState(false)
  const [weeklyPlannerOpen, setWeeklyPlannerOpen] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [checklistCollegeId, setChecklistCollegeId] = useState('')
  const [financialAidOpen, setFinancialAidOpen] = useState(false)
  const [financialAidReviewOpen, setFinancialAidReviewOpen] = useState(false)
  const [eventBuilderOpen, setEventBuilderOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SagePlanEvent | null>(null)
  const [focusMode, setFocusMode] = useState<SagePlanFocusMode>('all')
  const [focusCollegeId, setFocusCollegeId] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      setPlan(null)
      setTasks([])
      setDependencies([])
      setPlanColleges([])
      setEvents([])
      return
    }

    let active = true
    setLoading(true)
    setError('')
    Promise.all([
      getOrCreateActivePlan(user.id),
      supabase.from('hearted_schools').select('college_id,college_name').eq('user_id', user.id).order('created_at', { ascending: true }),
    ])
      .then(async ([activePlan, heartsResult]) => {
        if (heartsResult.error) throw new Error(heartsResult.error.message)
        const savedSchools = (heartsResult.data ?? []) as SavedSchoolForPlan[]
        const [planTasks, cachedDeadlines, colleges, planEvents] = await Promise.all([
          loadPlanTasks(activePlan.id),
          getCachedDeadlines(savedSchools.map(school => school.college_id)),
          syncPlanColleges(activePlan.id, savedSchools),
          loadPlanEvents(activePlan.id),
        ])
        const taskDependencies = await loadPlanDependencies(planTasks.map(task => task.id))
        if (!active) return
        setPlan(activePlan)
        setTasks(planTasks)
        setDependencies(taskDependencies)
        setSchools(savedSchools)
        setPlanColleges(colleges)
        setEvents(planEvents)
        setDeadlines(cachedDeadlines)
      })
      .catch(() => {
        if (active) setError('Your plan couldn’t load. Refresh and try again.')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [user, authLoading])

  const focusedTasks = useMemo(
    () => filterTasksForFocus(tasks, dependencies, focusMode, focusCollegeId),
    [tasks, dependencies, focusMode, focusCollegeId],
  )
  const groups = useMemo(() => groupTasksForWeek(focusedTasks), [focusedTasks])
  const progress = useMemo(() => calculatePlanProgress(tasks), [tasks])
  const nextTask = useMemo(() => nextTaskNeedingAttention(focusedTasks.filter(task => (
    focusMode === 'waiting' || (
      (task.waiting_on ?? 'none') === 'none'
      && incompleteDependencyIds(task.id, dependencies, tasks).length === 0
    )
  ))), [focusedTasks, focusMode, tasks, dependencies])
  const upcoming = useMemo(
    () => focusedTasks
      .filter(task => task.due_date && task.status !== 'done' && task.status !== 'skipped')
      .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
      .slice(0, 6),
    [focusedTasks],
  )
  const focusCounts = useMemo(() => {
    const modes: SagePlanFocusMode[] = ['all', 'student', 'parent', 'essays', 'financial_aid', 'overdue', 'waiting']
    return Object.fromEntries(modes.map(mode => [
      mode,
      filterTasksForFocus(tasks, dependencies, mode, focusCollegeId)
        .filter(task => task.status !== 'done' && task.status !== 'skipped').length,
    ])) as Record<SagePlanFocusMode, number>
  }, [tasks, dependencies, focusCollegeId])
  const focusActive = focusMode !== 'all' || focusCollegeId !== ''
  const focusedOpenCount = focusedTasks.filter(task => task.status !== 'done' && task.status !== 'skipped').length
  const importableCount = useMemo(
    () => Object.values(deadlines).reduce((count, deadline) => count + (deadline.rounds?.length ?? 0), 0),
    [deadlines],
  )
  const financialAidTasks = useMemo(
    () => tasks.filter(task => task.category === 'financial_aid'),
    [tasks],
  )

  function openNewTask() {
    setEditingTask(null)
    setEditorOpen(true)
  }

  function openTask(task: SagePlanTask) {
    setEditingTask(task)
    setEditorOpen(true)
  }

  async function saveTask(draft: SagePlanTaskDraft, dependencyIds: string[]) {
    if (!plan) return
    const saved = editingTask
      ? await updatePlanTask(editingTask.id, draft)
      : await createPlanTask(plan.id, draft)
    const savedDependencies = await replaceTaskDependencies(saved.id, dependencyIds)
    setTasks(current => editingTask
      ? current.map(task => task.id === saved.id ? saved : task)
      : [...current, saved])
    setDependencies(current => [
      ...current.filter(dependency => dependency.task_id !== saved.id),
      ...savedDependencies,
    ])
    setEditorOpen(false)
    setEditingTask(null)
    setMessage(editingTask ? 'Task updated.' : 'Added to this week’s plan.')
  }

  async function removeTask() {
    if (!editingTask) return
    await deletePlanTask(editingTask.id)
    setTasks(current => current.filter(task => task.id !== editingTask.id))
    setDependencies(current => current.filter(dependency => (
      dependency.task_id !== editingTask.id && dependency.depends_on_task_id !== editingTask.id
    )))
    setEditorOpen(false)
    setEditingTask(null)
    setMessage('Task removed.')
  }

  async function changeStatus(task: SagePlanTask, status: SagePlanTaskStatus) {
    try {
      const saved = await updatePlanTask(task.id, { status })
      setTasks(current => current.map(item => item.id === saved.id ? saved : item))
      setMessage(status === 'done' ? 'Nice. That one’s done.' : status === 'in_progress' ? 'Marked in progress.' : 'Task reopened.')
    } catch {
      setError('That update didn’t stick. Try again.')
    }
  }

  async function handoff(task: SagePlanTask) {
    const owner_role: SagePlanOwnerRole = task.owner_role === 'student' ? 'parent' : 'student'
    try {
      const saved = await updatePlanTask(task.id, { owner_role })
      setTasks(current => current.map(item => item.id === saved.id ? saved : item))
      setMessage(`Handed off to ${owner_role === 'student' ? 'Student' : 'Parent'}.`)
    } catch {
      setError('That handoff didn’t save. Try again.')
    }
  }

  async function importDates() {
    if (!plan || importing) return
    setImporting(true)
    setError('')
    setMessage('')
    try {
      const imported = await importDeadlineTasks(plan.id, schools, deadlines)
      if (imported.length) {
        setTasks(current => [...current, ...imported])
        setMessage(`Added ${imported.length} deadline${imported.length === 1 ? '' : 's'} from My Schools.`)
      } else if (!schools.length) {
        setMessage('Save a school first, then its known deadlines can come with you.')
      } else if (!importableCount) {
        setMessage('No verified dates are ready to import yet. You can still add a task yourself.')
      } else {
        setMessage('Your known deadlines are already in the plan.')
      }
    } catch {
      setError('Those deadlines didn’t import. Nothing else changed—try again.')
    } finally {
      setImporting(false)
    }
  }

  async function buildChecklist(school: SavedSchoolForPlan, date: string, round: string) {
    if (!plan) return
    const imported = await importApplicationChecklist(plan.id, school, date, round)
    const [planTasks, colleges] = await Promise.all([
      loadPlanTasks(plan.id),
      syncPlanColleges(plan.id, schools),
    ])
    const taskDependencies = await loadPlanDependencies(planTasks.map(task => task.id))
    setTasks(planTasks)
    setDependencies(taskDependencies)
    setPlanColleges(colleges)
    setChecklistOpen(false)
    setChecklistCollegeId('')
    setMessage(imported.length
      ? `Added ${imported.length} checklist step${imported.length === 1 ? '' : 's'} for ${school.college_name}.`
      : `${school.college_name} already has this checklist.`)
  }

  async function buildFinancialAidChecklist(deadlineDate: string, selectedSchools: SavedSchoolForPlan[]) {
    if (!plan) return
    const imported = await importFinancialAidChecklist(plan.id, { deadlineDate, schools: selectedSchools })
    const planTasks = await loadPlanTasks(plan.id)
    setTasks(planTasks)
    setDependencies(await loadPlanDependencies(planTasks.map(task => task.id)))
    setFinancialAidOpen(false)
    setMessage(imported.length
      ? `Added ${imported.length} financial aid step${imported.length === 1 ? '' : 's'} to your plan.`
      : 'Your financial aid checklist is current. Open any task to adjust it.')
  }

  async function buildVisitOrInterview(draft: SagePlanEventDraft) {
    if (!plan) return
    const created = await createPlanEventWithChecklist(plan.id, draft)
    const planTasks = await loadPlanTasks(plan.id)
    setEvents(current => [...current, created.event].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setTasks(planTasks)
    setDependencies(await loadPlanDependencies(planTasks.map(task => task.id)))
    setEventBuilderOpen(false)
    setSelectedEvent(created.event)
    setMessage(`Added ${created.tasks.length} preparation steps for ${created.event.college_name}.`)
  }

  async function saveVisitOrInterview(update: { questions: string[]; notes: string | null; status: SagePlanEventStatus }) {
    if (!selectedEvent || !plan) return
    const saved = await updatePlanEvent(selectedEvent.id, update)
    const planTasks = await loadPlanTasks(plan.id)
    setEvents(current => current.map(event => event.id === saved.id ? saved : event))
    setTasks(planTasks)
    setDependencies(await loadPlanDependencies(planTasks.map(task => task.id)))
    setSelectedEvent(saved)
    setMessage('Visit details saved.')
  }

  async function planThisWeek(taskIds: string[]) {
    if (!plan) return
    const savedTasks = await saveWeeklyPlan(plan.id, tasks, taskIds)
    setTasks(savedTasks)
    setPlan(current => current ? { ...current, last_weekly_planned_for: startOfWeekISO() } : current)
    setWeeklyPlannerOpen(false)
    setMessage(`This week is set with ${taskIds.length} priorit${taskIds.length === 1 ? 'y' : 'ies'}.`)
  }

  async function changeCollegeStage(college: SagePlanCollege, stage: SagePlanCollegeStage) {
    if (!plan) return
    try {
      const result = await applyCollegeStageTransition(plan.id, college, stage, tasks)
      setPlanColleges(current => current.map(item => item.id === result.college.id ? result.college : item))
      setTasks(result.tasks)
      setDependencies(await loadPlanDependencies(result.tasks.map(task => task.id)))
      setMessage(`${college.college_name} is now ${stage.replace('_', ' ')}.`)
    } catch {
      setError('That application stage didn’t save. Try again.')
    }
  }

  function openChecklist(collegeId = '') {
    setChecklistCollegeId(collegeId)
    setChecklistOpen(true)
  }

  if (authLoading || loading) {
    return <div className="plan-loading" role="status"><SageOrb size={54} /><span>Getting your week together…</span></div>
  }

  if (!user) {
    return (
      <div className="app-frame plan-guest">
        <section className="plan-guest-card">
          <div className="plan-guest-orb"><SageOrb size={78} animate /></div>
          <span className="pill teal">Sage Plan</span>
          <h1>Your college list, with a next step.</h1>
          <p>Turn deadlines, essays, visits, and financial aid into one calm weekly plan. You’ll need a free account so your progress stays yours.</p>
          <div className="filters" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={() => setAuthOpen(true)}>Create a free account</button>
            <button className="btn secondary" onClick={() => navigate('/profile')}>See My Schools</button>
          </div>
        </section>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />}
      </div>
    )
  }

  return (
    <div className="app-frame sage-plan-page">
      <section className="plan-hero">
        <div className="plan-hero-copy">
          <span className="pill plan-hero-pill"><CalendarCheck2 size={13} aria-hidden="true" /> Sage Plan · {plan?.application_cycle ?? currentApplicationCycle()}</span>
          <h1>Your week, minus the chaos.</h1>
          <p>{weekLabel()} · Keep the next step clear, then keep moving.</p>
        </div>
        <div className="plan-hero-action">
          <span>Needs your attention next</span>
          <strong>{nextTask?.title ?? (focusActive ? 'Nothing in this focus' : 'Add your first task')}</strong>
          <small>{nextTask ? `${nextTask.owner_role === 'student' ? 'Student' : 'Parent'} · ${relativeDue(nextTask.due_date)}` : focusActive ? 'Try another focus or clear the filters.' : 'Start small. One real next step is enough.'}</small>
        </div>
        <button className="btn plan-add-button" onClick={openNewTask}><Plus size={17} aria-hidden="true" /> Add task</button>
      </section>

      {(message || error) && (
        <div className={error ? 'plan-notice error' : 'plan-notice'} role={error ? 'alert' : 'status'}>
          {error || message}
          <button aria-label="Dismiss message" onClick={() => { setMessage(''); setError('') }}>×</button>
        </div>
      )}

      <section className="plan-progress-grid" aria-label="Plan progress">
        <article className="plan-progress-card plan-progress-primary">
          <div className="plan-progress-ring" style={{ '--plan-progress': `${progress.percent * 3.6}deg` } as React.CSSProperties}>
            <strong>{progress.percent}%</strong>
          </div>
          <div><span>Plan progress</span><strong>{progress.completed} of {progress.total} done</strong></div>
        </article>
        <article className="plan-progress-card"><Clock3 size={19} aria-hidden="true" /><div><span>Due in 14 days</span><strong>{progress.dueSoon}</strong></div></article>
        <article className="plan-progress-card"><UserRound size={19} aria-hidden="true" /><div><span>Student owns</span><strong>{progress.studentOpen}</strong></div></article>
        <article className="plan-progress-card"><UsersRound size={19} aria-hidden="true" /><div><span>Parent owns</span><strong>{progress.parentOpen}</strong></div></article>
      </section>

      <PlanFocusBar
        mode={focusMode}
        collegeId={focusCollegeId}
        schools={schools}
        counts={focusCounts}
        onModeChange={setFocusMode}
        onCollegeChange={setFocusCollegeId}
        onClear={() => { setFocusMode('all'); setFocusCollegeId('') }}
      />

      <div className="plan-workbench">
        <div className="plan-week-column">
          <section className="plan-week-reset-card">
            <div className="plan-week-reset-icon"><RefreshCw size={18} aria-hidden="true" /></div>
            <div>
              <strong>{plan?.last_weekly_planned_for === startOfWeekISO() ? 'This week has a shape.' : 'Give this week a shape.'}</strong>
              <p>Pull forward a small set of priorities. You can reset it whenever the week changes.</p>
            </div>
            <button className="btn secondary" onClick={() => setWeeklyPlannerOpen(true)}>
              <ListChecks size={15} aria-hidden="true" /> Plan my week
            </button>
          </section>
          {tasks.length ? (
            <>
              <TaskGroup title="Needs attention" description="Overdue or marked urgent." tasks={groups.needsAttention} allTasks={tasks} dependencies={dependencies} tone="attention" onOpen={openTask} onStatus={changeStatus} onHandoff={handoff} />
              <TaskGroup title="This week" description="The work you chose for right now." tasks={groups.thisWeek} allTasks={tasks} dependencies={dependencies} onOpen={openTask} onStatus={changeStatus} onHandoff={handoff} />
              <TaskGroup title="Up next" description="Coming soon, without crowding this week." tasks={groups.upNext.slice(0, 8)} allTasks={tasks} dependencies={dependencies} onOpen={openTask} onStatus={changeStatus} onHandoff={handoff} />
              {focusActive && focusedOpenCount === 0 ? (
                <section className="plan-all-done plan-focus-empty">
                  <div><ListFilter size={22} aria-hidden="true" /></div>
                  <h2>Nothing needs attention here.</h2>
                  <p>This focus is clear. Choose another area, or come back to the whole plan.</p>
                  <button className="btn secondary" onClick={() => { setFocusMode('all'); setFocusCollegeId('') }}>Clear focus</button>
                </section>
              ) : !groups.needsAttention.length && !groups.thisWeek.length && !groups.upNext.length && (
                <section className="plan-all-done">
                  <div><Check size={22} aria-hidden="true" /></div>
                  <h2>You’re clear for now.</h2>
                  <p>Everything in this plan is done or skipped. Add the next real step when you’re ready.</p>
                  <button className="btn secondary" onClick={openNewTask}>Add what’s next</button>
                </section>
              )}
            </>
          ) : (
            <section className="plan-empty-state">
              <div className="plan-empty-icon"><Sparkles size={24} aria-hidden="true" /></div>
              <h2>Let’s make this week feel doable.</h2>
              <p>Bring in known application dates from My Schools, or add the one thing you already know needs to happen.</p>
              <div className="filters" style={{ justifyContent: 'center' }}>
                <button className="btn" onClick={openNewTask}><Plus size={16} aria-hidden="true" /> Add a task</button>
                <button className="btn secondary" onClick={() => void importDates()} disabled={importing}>
                  <Download size={16} aria-hidden="true" /> {importing ? 'Importing…' : 'Import from My Schools'}
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className="plan-side-column">
          <section className="mock-card section-pad plan-side-card">
            <div className="plan-section-heading">
              <div><h2><CalendarDays size={17} aria-hidden="true" /> Upcoming deadlines</h2><p>{focusActive ? 'The next dates in this focus.' : 'The next dates across your plan.'}</p></div>
            </div>
            {upcoming.length ? (
              <div className="plan-deadline-list">
                {upcoming.map(task => (
                  <button key={task.id} onClick={() => openTask(task)}>
                    <time dateTime={task.due_date ?? undefined}>
                      <strong>{task.due_date ? new Date(`${task.due_date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : ''}</strong>
                      <span>{task.due_date ? new Date(`${task.due_date}T12:00:00`).getDate() : ''}</span>
                    </time>
                    <span><strong>{task.title}</strong><small>{task.college_name ?? CATEGORY_LABELS[task.category]}</small></span>
                    <ChevronRight size={15} aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : <p className="match-note">No dated tasks yet. Add a due date and it’ll show up here.</p>}
          </section>

          <section className="mock-card section-pad plan-side-card plan-import-card">
            <div className="plan-section-heading">
              <div><h2><Download size={17} aria-hidden="true" /> My Schools</h2><p>{schools.length} saved · {importableCount} known dates</p></div>
            </div>
            <p>Bring in application deadlines Admyt already knows. Re-importing won’t make duplicates.</p>
            <button className="btn secondary" onClick={() => void importDates()} disabled={importing || !plan}>
              {importing ? 'Importing…' : 'Import known deadlines'}
            </button>
            <button className="btn secondary" onClick={() => openChecklist()} disabled={!schools.length}>
              <ClipboardCheck size={16} aria-hidden="true" /> Build application checklist
            </button>
            {!schools.length && <button className="plan-text-link" onClick={() => navigate('/search')}>Browse schools <ChevronRight size={14} aria-hidden="true" /></button>}
          </section>

          <FinancialAidCard
            tasks={financialAidTasks}
            onBuild={() => setFinancialAidOpen(true)}
            onReview={() => setFinancialAidReviewOpen(true)}
            onOpen={openTask}
          />

          <VisitInterviewCard
            events={events}
            onBuild={() => setEventBuilderOpen(true)}
            onOpen={setSelectedEvent}
          />

          <CollegeStagesCard colleges={planColleges} onStageChange={changeCollegeStage} onChecklist={openChecklist} />

          <section className="mock-soft-card section-pad plan-trust-card">
            <strong>Deadlines deserve a double-check.</strong>
            <p>Imported dates come from school sources. Confirm the final date on the school’s admissions site before you rely on it.</p>
            {upcoming.find(task => task.source_url)?.source_url && (
              <a href={upcoming.find(task => task.source_url)?.source_url ?? ''} target="_blank" rel="noopener noreferrer">
                Open a source <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
          </section>
        </aside>
      </div>

      {editorOpen && (
        <TaskEditor
          key={editingTask?.id ?? 'new'}
          task={editingTask}
          tasks={tasks}
          dependencies={dependencies}
          schools={schools}
          onClose={() => { setEditorOpen(false); setEditingTask(null) }}
          onSave={saveTask}
          onDelete={editingTask ? removeTask : undefined}
        />
      )}
      {weeklyPlannerOpen && (
        <WeeklyPlanner
          tasks={tasks}
          dependencies={dependencies}
          onClose={() => setWeeklyPlannerOpen(false)}
          onSave={planThisWeek}
        />
      )}
      {checklistOpen && (
        <ChecklistBuilder
          schools={checklistCollegeId
            ? [...schools.filter(school => school.college_id === checklistCollegeId), ...schools.filter(school => school.college_id !== checklistCollegeId)]
            : schools}
          deadlines={deadlines}
          onClose={() => { setChecklistOpen(false); setChecklistCollegeId('') }}
          onImport={buildChecklist}
        />
      )}
      {financialAidOpen && (
        <FinancialAidBuilder
          schools={schools}
          onClose={() => setFinancialAidOpen(false)}
          onImport={buildFinancialAidChecklist}
        />
      )}
      {financialAidReviewOpen && (
        <FinancialAidReview
          tasks={financialAidTasks}
          onClose={() => setFinancialAidReviewOpen(false)}
          onOpenTask={task => {
            setFinancialAidReviewOpen(false)
            openTask(task)
          }}
          onStatus={changeStatus}
          onSetup={() => {
            setFinancialAidReviewOpen(false)
            setFinancialAidOpen(true)
          }}
        />
      )}
      {eventBuilderOpen && plan && (
        <VisitInterviewBuilder
          planId={plan.id}
          schools={schools}
          onClose={() => setEventBuilderOpen(false)}
          onCreate={buildVisitOrInterview}
        />
      )}
      {selectedEvent && (
        <VisitInterviewDetail
          key={selectedEvent.id}
          event={selectedEvent}
          tasks={tasks}
          onClose={() => setSelectedEvent(null)}
          onSave={saveVisitOrInterview}
          onOpenTask={task => {
            setSelectedEvent(null)
            openTask(task)
          }}
        />
      )}
    </div>
  )
}
