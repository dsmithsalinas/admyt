import { ListFilter, X } from 'lucide-react'
import type { SagePlanFocusMode, SavedSchoolForPlan } from '@/lib/sagePlan'

const FOCUS_LABELS: Record<SagePlanFocusMode, string> = {
  all: 'All work',
  student: 'Student',
  parent: 'Parent',
  essays: 'Essays',
  financial_aid: 'Financial aid',
  overdue: 'Overdue',
  waiting: 'Waiting',
}

const FOCUS_MODES = Object.keys(FOCUS_LABELS) as SagePlanFocusMode[]

export function PlanFocusBar({
  mode,
  collegeId,
  schools,
  counts,
  onModeChange,
  onCollegeChange,
  onClear,
}: {
  mode: SagePlanFocusMode
  collegeId: string
  schools: SavedSchoolForPlan[]
  counts: Record<SagePlanFocusMode, number>
  onModeChange: (mode: SagePlanFocusMode) => void
  onCollegeChange: (collegeId: string) => void
  onClear: () => void
}) {
  const active = mode !== 'all' || collegeId !== ''
  const selectedSchool = schools.find(school => school.college_id === collegeId)
  const summary = [mode !== 'all' ? FOCUS_LABELS[mode] : '', selectedSchool?.college_name ?? ''].filter(Boolean).join(' · ')

  return (
    <section className="plan-focus-bar" aria-labelledby="plan-focus-title">
      <div className="plan-focus-heading">
        <span className="plan-focus-icon"><ListFilter size={17} aria-hidden="true" /></span>
        <div>
          <h2 id="plan-focus-title">Focus your plan</h2>
          <p>{active ? `Showing ${summary}.` : 'Cut through the noise without changing the plan.'}</p>
        </div>
        <span className="pill plan-focus-count">{counts[mode]} open</span>
        {active && <button className="plan-focus-clear" onClick={onClear}><X size={13} aria-hidden="true" /> Clear</button>}
      </div>
      <div className="plan-focus-controls">
        <div className="plan-focus-pills" role="group" aria-label="Focus mode">
          {FOCUS_MODES.map(value => (
            <button
              key={value}
              className={`plan-focus-pill${mode === value ? ' active' : ''}`}
              aria-pressed={mode === value}
              onClick={() => onModeChange(value)}
            >
              <span>{FOCUS_LABELS[value]}</span>
              <small>{counts[value]}</small>
            </button>
          ))}
        </div>
        {schools.length > 0 && (
          <label className="plan-focus-school">
            <span>School</span>
            <select aria-label="Focus by school" value={collegeId} onChange={event => onCollegeChange(event.target.value)}>
              <option value="">All schools</option>
              {schools.map(school => <option key={school.college_id} value={school.college_id}>{school.college_name}</option>)}
            </select>
          </label>
        )}
      </div>
    </section>
  )
}
