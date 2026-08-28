import { useMemo, useState } from 'react'
import { CalendarRange, Check, ChevronRight, ClipboardCheck, Clock3, GitBranch, GraduationCap, Landmark, Plus, UserRound, UsersRound, WalletCards } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { CollegeDeadlines } from '@/lib/deadlines'
import {
  applicationChecklistFromSchool,
  financialAidChecklistForPlan,
  incompleteDependencyIds,
  startOfWeekISO,
  type SagePlanCollege,
  type SagePlanCollegeStage,
  type SagePlanTask,
  type SagePlanTaskDependency,
  type SagePlanTaskStatus,
  type SavedSchoolForPlan,
} from '@/lib/sagePlan'

export const COLLEGE_STAGE_LABELS: Record<SagePlanCollegeStage, string> = {
  planning: 'Planning',
  applying: 'Applying',
  submitted: 'Submitted',
  complete: 'Complete',
  admitted: 'Admitted',
  waitlisted: 'Waitlisted',
  denied: 'Denied',
  withdrawn: 'Withdrawn',
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function WeeklyPlanner({
  tasks,
  dependencies,
  onClose,
  onSave,
}: {
  tasks: SagePlanTask[]
  dependencies: SagePlanTaskDependency[]
  onClose: () => void
  onSave: (taskIds: string[]) => Promise<void>
}) {
  const weekStart = startOfWeekISO()
  const candidates = useMemo(() => tasks
    .filter(task => task.status !== 'done' && task.status !== 'skipped')
    .sort((a, b) => (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31')),
  [tasks])
  const [selected, setSelected] = useState(() => new Set(
    candidates.filter(task => task.scheduled_week === weekStart).map(task => task.id),
  ))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggle(taskId: string) {
    setSelected(current => {
      const next = new Set(current)
      if (next.has(taskId)) next.delete(taskId)
      else if (next.size < 5) next.add(taskId)
      return next
    })
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await onSave([...selected])
    } catch {
      setError('This week didn’t save. Nothing else changed—try again.')
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="weekly-planner-title" panelStyle={{ maxWidth: 660, padding: 0, maxHeight: '88vh' }}>
      <div className="frame-head">
        <div>
          <span className="mini-title">Weekly reset</span>
          <h2 id="weekly-planner-title" className="plan-modal-title">What fits this week?</h2>
        </div>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      <div className="plan-flow-body">
        <div className="plan-flow-intro">
          <CalendarRange size={22} aria-hidden="true" />
          <div>
            <strong>Choose up to five real priorities.</strong>
            <p>Anything unfinished can come forward. Deadlines due this week stay visible even if you don’t select them.</p>
          </div>
          <span className={`plan-capacity${selected.size === 5 ? ' full' : ''}`}>{selected.size}/5</span>
        </div>
        {candidates.length ? (
          <div className="plan-choice-list">
            {candidates.map(task => {
              const blockers = incompleteDependencyIds(task.id, dependencies, tasks)
              const blocked = blockers.length > 0 || task.waiting_on !== 'none'
              return (
                <label className={`plan-choice-row${selected.has(task.id) ? ' selected' : ''}${blocked ? ' blocked' : ''}`} key={task.id}>
                  <input
                    type="checkbox"
                    checked={selected.has(task.id)}
                    onChange={() => toggle(task.id)}
                    disabled={!selected.has(task.id) && selected.size >= 5}
                  />
                  <span className="plan-choice-check">{selected.has(task.id) && <Check size={14} aria-hidden="true" />}</span>
                  <span>
                    <strong>{task.title}</strong>
                    <small>{task.college_name ?? 'General'}{task.due_date ? ` · Due ${dateLabel(task.due_date)}` : ''}</small>
                  </span>
                  {blocked && <span className="pill amber"><GitBranch size={11} aria-hidden="true" /> Blocked</span>}
                </label>
              )
            })}
          </div>
        ) : <p className="match-note">Add a task first, then use this reset to shape the week.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="plan-flow-actions">
          <span>{selected.size < 3 ? 'A lighter week is still a real plan.' : 'That looks like a focused week.'}</span>
          <button className="btn" onClick={() => void save()} disabled={saving || !candidates.length}>
            {saving ? 'Saving…' : 'Save this week'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function ChecklistBuilder({
  schools,
  deadlines,
  onClose,
  onImport,
}: {
  schools: SavedSchoolForPlan[]
  deadlines: Record<string, CollegeDeadlines>
  onClose: () => void
  onImport: (school: SavedSchoolForPlan, date: string, round: string) => Promise<void>
}) {
  const [collegeId, setCollegeId] = useState(schools[0]?.college_id ?? '')
  const rounds = deadlines[collegeId]?.rounds ?? []
  const [roundChoice, setRoundChoice] = useState(rounds[0] ? `${rounds[0].type}|${rounds[0].date}` : 'custom')
  const [customRound, setCustomRound] = useState('Regular Decision')
  const [customDate, setCustomDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const school = schools.find(item => item.college_id === collegeId)
  const selectedRound = roundChoice === 'custom'
    ? { type: customRound.trim(), date: customDate }
    : (() => {
      const divider = roundChoice.lastIndexOf('|')
      return { type: roundChoice.slice(0, divider), date: roundChoice.slice(divider + 1) }
    })()
  const preview = school && selectedRound.date
    ? applicationChecklistFromSchool('preview', school, selectedRound.date, selectedRound.type || 'Application')
    : []

  function changeSchool(nextCollegeId: string) {
    setCollegeId(nextCollegeId)
    const nextRound = deadlines[nextCollegeId]?.rounds?.[0]
    setRoundChoice(nextRound ? `${nextRound.type}|${nextRound.date}` : 'custom')
  }

  async function addChecklist() {
    if (!school || !selectedRound.date || !selectedRound.type || saving) return
    setSaving(true)
    setError('')
    try {
      await onImport(school, selectedRound.date, selectedRound.type)
    } catch {
      setError('That checklist didn’t import. Nothing else changed—try again.')
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="checklist-builder-title" panelStyle={{ maxWidth: 680, padding: 0, maxHeight: '88vh' }}>
      <div className="frame-head">
        <div>
          <span className="mini-title">Application checklist</span>
          <h2 id="checklist-builder-title" className="plan-modal-title">Build the path to submit</h2>
        </div>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      <div className="plan-flow-body">
        <div className="plan-checklist-fields">
          <label className="plan-field">
            School
            <select className="field" value={collegeId} onChange={event => changeSchool(event.target.value)}>
              {schools.map(item => <option value={item.college_id} key={item.college_id}>{item.college_name}</option>)}
            </select>
          </label>
          <label className="plan-field">
            Application deadline
            <select className="field" value={roundChoice} onChange={event => setRoundChoice(event.target.value)}>
              {rounds.map(round => <option value={`${round.type}|${round.date}`} key={`${round.type}-${round.date}`}>{round.type} · {dateLabel(round.date)}</option>)}
              <option value="custom">Enter another date</option>
            </select>
          </label>
          {roundChoice === 'custom' && (
            <>
              <label className="plan-field">Round<input className="field" value={customRound} onChange={event => setCustomRound(event.target.value)} maxLength={100} /></label>
              <label className="plan-field">Deadline<input className="field" type="date" value={customDate} onChange={event => setCustomDate(event.target.value)} /></label>
            </>
          )}
        </div>
        <div className="plan-checklist-preview">
          <div className="plan-section-heading">
            <div><h2><ClipboardCheck size={17} aria-hidden="true" /> What comes with it</h2><p>Ten editable steps, timed backward from the deadline.</p></div>
            <span className="pill">{preview.length}</span>
          </div>
          {preview.length ? (
            <ol>
              {preview.map(item => <li key={item.key}><span>{item.draft.title}</span><small>{item.draft.due_date ? dateLabel(item.draft.due_date) : ''}</small></li>)}
            </ol>
          ) : <p className="match-note">Choose a deadline to preview the checklist.</p>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="plan-flow-actions">
          <span>Already imported deadlines are reused, not duplicated.</span>
          <button className="btn" onClick={() => void addChecklist()} disabled={!school || !selectedRound.date || !selectedRound.type || saving}>
            {saving ? 'Building…' : 'Add checklist'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function FinancialAidBuilder({
  schools,
  onClose,
  onImport,
}: {
  schools: SavedSchoolForPlan[]
  onClose: () => void
  onImport: (deadlineDate: string, schools: SavedSchoolForPlan[]) => Promise<void>
}) {
  const [deadlineDate, setDeadlineDate] = useState('')
  const [selectedSchoolIds, setSelectedSchoolIds] = useState(() => new Set(schools.map(school => school.college_id)))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const selectedSchools = schools.filter(school => selectedSchoolIds.has(school.college_id))
  const preview = deadlineDate
    ? financialAidChecklistForPlan('preview', { deadlineDate, schools: selectedSchools })
    : []
  const sharedCount = preview.filter(item => !item.draft.college_id).length

  function toggleSchool(collegeId: string) {
    setSelectedSchoolIds(current => {
      const next = new Set(current)
      if (next.has(collegeId)) next.delete(collegeId)
      else next.add(collegeId)
      return next
    })
  }

  async function addChecklist() {
    if (!deadlineDate || saving) return
    setSaving(true)
    setError('')
    try {
      await onImport(deadlineDate, selectedSchools)
    } catch {
      setError('That financial aid checklist didn’t save. Nothing else changed—try again.')
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="financial-aid-builder-title" panelStyle={{ maxWidth: 700, padding: 0, maxHeight: '88vh' }}>
      <div className="frame-head">
        <div>
          <span className="mini-title">Financial aid checklist</span>
          <h2 id="financial-aid-builder-title" className="plan-modal-title">Make the money steps visible</h2>
        </div>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      <div className="plan-flow-body">
        <div className="plan-flow-intro plan-aid-intro">
          <Landmark size={22} aria-hidden="true" />
          <div>
            <strong>Start with your earliest financial aid deadline.</strong>
            <p>We’ll work backward, split student and parent responsibilities, and add school-specific follow-ups.</p>
          </div>
        </div>
        <label className="plan-field">
          Earliest financial aid deadline
          <input className="field" type="date" value={deadlineDate} onInput={event => setDeadlineDate(event.currentTarget.value)} />
          <small>Use the earliest priority date you find. You can edit every task later.</small>
        </label>
        <fieldset className="plan-field plan-school-picker">
          <legend>Schools to include</legend>
          <small>Shared FAFSA work is added once. Each selected school gets its own requirement and completion checks.</small>
          {schools.length ? (
            <div>
              {schools.map(school => (
                <label key={school.college_id}>
                  <input type="checkbox" checked={selectedSchoolIds.has(school.college_id)} onChange={() => toggleSchool(school.college_id)} />
                  <span>{school.college_name}</span>
                </label>
              ))}
            </div>
          ) : <p className="match-note">No saved schools yet. You can still add the shared household checklist.</p>}
        </fieldset>
        <div className="plan-checklist-preview plan-aid-preview">
          <div className="plan-section-heading">
            <div><h2><WalletCards size={17} aria-hidden="true" /> What comes with it</h2><p>{sharedCount || 8} shared steps, plus three checks for each selected school.</p></div>
            <span className="pill teal">{preview.length || 8 + (selectedSchools.length * 3)}</span>
          </div>
          {preview.length ? (
            <ol>
              {preview.map(item => (
                <li key={item.key}>
                  <span>{item.draft.title}<small>{item.draft.college_name ?? (item.draft.owner_role === 'parent' ? 'Parent' : 'Shared')}</small></span>
                  <small>{item.draft.due_date ? dateLabel(item.draft.due_date) : ''}</small>
                </li>
              ))}
            </ol>
          ) : <p className="match-note plan-preview-empty">Choose a deadline to see the full checklist.</p>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="plan-flow-actions">
          <span>Requirements vary. Double-check each school’s financial aid site.</span>
          <button className="btn" onClick={() => void addChecklist()} disabled={!deadlineDate || saving}>
            {saving ? 'Building…' : 'Add financial aid checklist'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function FinancialAidCard({
  tasks,
  onBuild,
  onReview,
  onOpen,
}: {
  tasks: SagePlanTask[]
  onBuild: () => void
  onReview: () => void
  onOpen: (task: SagePlanTask) => void
}) {
  const included = tasks.filter(task => task.status !== 'skipped')
  const completed = included.filter(task => task.status === 'done').length
  const open = included.filter(task => task.status !== 'done')
  const parentOpen = open.filter(task => task.owner_role === 'parent').length
  const next = [...open].sort((a, b) => (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31')).slice(0, 2)
  const percent = included.length ? Math.round((completed / included.length) * 100) : 0

  return (
    <section className="mock-card section-pad plan-side-card plan-aid-card">
      <div className="plan-section-heading">
        <div><h2><WalletCards size={17} aria-hidden="true" /> Financial aid</h2><p>{included.length ? `${completed} of ${included.length} done` : 'One lane for the money steps.'}</p></div>
        {included.length > 0 && <span className="pill teal">{percent}%</span>}
      </div>
      {included.length ? (
        <>
          <div className="plan-aid-summary">
            <span><UsersRound size={14} aria-hidden="true" /> {parentOpen} parent task{parentOpen === 1 ? '' : 's'} open</span>
            <div aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
          </div>
          <div className="plan-aid-next">
            {next.map(task => (
              <button key={task.id} onClick={() => onOpen(task)}>
                <span><strong>{task.title}</strong><small>{task.college_name ?? (task.owner_role === 'parent' ? 'Parent' : 'Shared')}</small></span>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      ) : <p className="plan-aid-empty">Start with one deadline. We’ll separate shared household work from each school’s follow-ups.</p>}
      <button className="btn secondary" onClick={included.length ? onReview : onBuild}>{included.length ? 'Review aid checklist' : 'Build financial aid checklist'}</button>
    </section>
  )
}

function aidTaskDate(task: SagePlanTask) {
  if (!task.due_date) return 'No due date'
  return `Due ${dateLabel(task.due_date)}`
}

export function FinancialAidReview({
  tasks,
  onClose,
  onOpenTask,
  onStatus,
  onSetup,
}: {
  tasks: SagePlanTask[]
  onClose: () => void
  onOpenTask: (task: SagePlanTask) => void
  onStatus: (task: SagePlanTask, status: SagePlanTaskStatus) => Promise<void>
  onSetup: () => void
}) {
  const included = tasks.filter(task => task.status !== 'skipped')
  const completed = included.filter(task => task.status === 'done').length
  const parentOpen = included.filter(task => task.status !== 'done' && task.owner_role === 'parent').length
  const groups = useMemo(() => {
    const sorted = [...included].sort((a, b) => (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31'))
    const grouped = new Map<string, SagePlanTask[]>()
    for (const task of sorted) {
      const key = task.college_name ?? 'Household steps'
      grouped.set(key, [...(grouped.get(key) ?? []), task])
    }
    return [...grouped.entries()].sort(([a], [b]) => {
      if (a === 'Household steps') return -1
      if (b === 'Household steps') return 1
      return a.localeCompare(b)
    })
  }, [included])

  return (
    <Modal onClose={onClose} labelledBy="financial-aid-review-title" panelStyle={{ maxWidth: 720, padding: 0, maxHeight: '88vh' }}>
      <div className="frame-head">
        <div>
          <span className="mini-title">Financial aid</span>
          <h2 id="financial-aid-review-title" className="plan-modal-title">Your financial aid checklist</h2>
        </div>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      <div className="plan-flow-body plan-aid-review-body">
        <div className="plan-aid-review-summary">
          <WalletCards size={23} aria-hidden="true" />
          <div>
            <strong>{completed} of {included.length} done</strong>
            <span>{parentOpen} parent task{parentOpen === 1 ? '' : 's'} still open</span>
          </div>
          <span className="pill teal">{included.length ? Math.round((completed / included.length) * 100) : 0}%</span>
        </div>
        <div className="plan-aid-review-groups">
          {groups.map(([name, groupTasks]) => (
            <section className="plan-aid-review-group" key={name}>
              <div>
                <h3>{name === 'Household steps' ? <UsersRound size={15} aria-hidden="true" /> : <Landmark size={15} aria-hidden="true" />}{name}</h3>
                <span>{groupTasks.filter(task => task.status === 'done').length}/{groupTasks.length}</span>
              </div>
              <div>
                {groupTasks.map(task => {
                  const isDone = task.status === 'done'
                  return (
                    <article className={isDone ? 'is-done' : ''} key={task.id}>
                      <button
                        className="plan-task-check"
                        aria-label={isDone ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
                        aria-pressed={isDone}
                        onClick={() => void onStatus(task, isDone ? 'todo' : 'done')}
                      >
                        {isDone && <Check size={15} aria-hidden="true" />}
                      </button>
                      <button className="plan-aid-review-task" onClick={() => onOpenTask(task)}>
                        <strong>{task.title}</strong>
                        <small><Clock3 size={11} aria-hidden="true" /> {aidTaskDate(task)}</small>
                      </button>
                      <span className={`plan-aid-owner ${task.owner_role}`}>
                        {task.owner_role === 'parent' ? <UsersRound size={11} aria-hidden="true" /> : <UserRound size={11} aria-hidden="true" />}
                        {task.owner_role === 'parent' ? 'Parent' : 'Student'}
                      </span>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
        <div className="plan-flow-actions plan-aid-review-actions">
          <span>Open any task to change its owner, date, blockers, or notes.</span>
          <button className="btn secondary" onClick={onSetup}><Plus size={15} aria-hidden="true" /> Add or refresh steps</button>
        </div>
      </div>
    </Modal>
  )
}

export function CollegeStagesCard({
  colleges,
  onStageChange,
  onChecklist,
}: {
  colleges: SagePlanCollege[]
  onStageChange: (college: SagePlanCollege, stage: SagePlanCollegeStage) => Promise<void>
  onChecklist: (collegeId: string) => void
}) {
  const [savingId, setSavingId] = useState('')

  async function change(college: SagePlanCollege, stage: SagePlanCollegeStage) {
    setSavingId(college.id)
    try {
      await onStageChange(college, stage)
    } finally {
      setSavingId('')
    }
  }

  return (
    <section className="mock-card section-pad plan-side-card plan-stages-card">
      <div className="plan-section-heading">
        <div><h2><GraduationCap size={17} aria-hidden="true" /> Application stages</h2><p>One current state for every school.</p></div>
      </div>
      {colleges.length ? (
        <div className="plan-stage-list">
          {colleges.map(college => (
            <div className="plan-stage-row" key={college.id}>
              <div>
                <strong>{college.college_name}</strong>
                <small>{college.application_round ?? 'No round selected'}{college.target_deadline ? ` · ${dateLabel(college.target_deadline)}` : ''}</small>
              </div>
              <select
                className={`plan-stage-select stage-${college.stage}`}
                aria-label={`${college.college_name} application stage`}
                value={college.stage}
                disabled={savingId === college.id}
                onChange={event => void change(college, event.target.value as SagePlanCollegeStage)}
              >
                {Object.entries(COLLEGE_STAGE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
              <button className="plan-stage-action" onClick={() => onChecklist(college.college_id)}>
                Checklist <ChevronRight size={13} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : <p className="match-note">Save a school to start tracking its application stage.</p>}
    </section>
  )
}
