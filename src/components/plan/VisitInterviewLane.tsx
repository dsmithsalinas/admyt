import { useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronRight, Clock3, MapPin, Plus, Video } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import {
  eventChecklistForPlan,
  suggestedEventQuestions,
  todayISO,
  type SagePlanEvent,
  type SagePlanEventDraft,
  type SagePlanEventFormat,
  type SagePlanEventStatus,
  type SagePlanEventType,
  type SagePlanTask,
  type SavedSchoolForPlan,
} from '@/lib/sagePlan'

const EVENT_LABELS: Record<SagePlanEventType, string> = {
  campus_tour: 'Campus tour',
  virtual_session: 'Virtual information session',
  open_house: 'Open house',
  admissions_interview: 'Admissions interview',
  alumni_interview: 'Alumni interview',
}

function eventDateLabel(event: SagePlanEvent) {
  return new Date(event.starts_at).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function VisitInterviewCard({
  events,
  onBuild,
  onOpen,
}: {
  events: SagePlanEvent[]
  onBuild: () => void
  onOpen: (event: SagePlanEvent) => void
}) {
  const scheduled = events.filter(event => event.status === 'scheduled')
  const next = scheduled.filter(event => new Date(event.starts_at).getTime() >= Date.now()).slice(0, 2)
  return (
    <section className="mock-card section-pad plan-side-card plan-event-card">
      <div className="plan-section-heading">
        <div><h2><MapPin size={17} aria-hidden="true" /> Visits & interviews</h2><p>{scheduled.length ? `${scheduled.length} scheduled` : 'Turn the date into a ready-to-go plan.'}</p></div>
        {scheduled.length > 0 && <span className="pill">{scheduled.length}</span>}
      </div>
      {next.length ? (
        <div className="plan-event-list">
          {next.map(event => (
            <button key={event.id} onClick={() => onOpen(event)}>
              <span className="plan-event-icon">{event.format === 'virtual' ? <Video size={15} aria-hidden="true" /> : <MapPin size={15} aria-hidden="true" />}</span>
              <span><strong>{EVENT_LABELS[event.event_type]}</strong><small>{event.college_name} · {eventDateLabel(event)}</small></span>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : <p className="plan-event-empty">Add a tour, open house, or interview. Sage Plan will build the preparation steps around it.</p>}
      <button className="btn secondary" onClick={onBuild}><Plus size={15} aria-hidden="true" /> Add visit or interview</button>
    </section>
  )
}

export function VisitInterviewBuilder({
  planId,
  schools,
  onClose,
  onCreate,
}: {
  planId: string
  schools: SavedSchoolForPlan[]
  onClose: () => void
  onCreate: (draft: SagePlanEventDraft) => Promise<void>
}) {
  const [collegeId, setCollegeId] = useState(schools[0]?.college_id ?? '')
  const [eventType, setEventType] = useState<SagePlanEventType>('campus_tour')
  const [format, setFormat] = useState<SagePlanEventFormat>('in_person')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [location, setLocation] = useState('')
  const [registrationUrl, setRegistrationUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const school = schools.find(item => item.college_id === collegeId)
  const draft = useMemo<SagePlanEventDraft | null>(() => {
    if (!school || !date || !time) return null
    return {
      college_id: school.college_id,
      college_name: school.college_name,
      event_type: eventType,
      format,
      starts_at: new Date(`${date}T${time}:00`).toISOString(),
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      location,
      registration_url: registrationUrl,
      questions: suggestedEventQuestions(eventType),
    }
  }, [school, date, time, eventType, format, location, registrationUrl])
  const preview = draft ? eventChecklistForPlan(planId, 'preview', draft) : []

  async function create() {
    if (!draft || saving) return
    setSaving(true)
    setError('')
    try {
      await onCreate(draft)
    } catch {
      setError('That event didn’t save. Nothing else changed—try again.')
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="visit-builder-title" panelStyle={{ maxWidth: 760, padding: 0, maxHeight: '90vh' }}>
      <div className="frame-head">
        <div><span className="mini-title">Visits & interviews</span><h2 id="visit-builder-title" className="plan-modal-title">Put the event on the plan</h2></div>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      <div className="plan-flow-body">
        <div className="plan-flow-intro plan-event-intro">
          <CalendarDays size={23} aria-hidden="true" />
          <div><strong>Start with the date. We’ll handle the runway.</strong><p>Sage Plan creates preparation, logistics, questions, attendance, and follow-up tasks.</p></div>
        </div>
        <div className="plan-event-fields">
          <label className="plan-field">School<select className="field" value={collegeId} onChange={event => setCollegeId(event.target.value)}>{schools.map(item => <option key={item.college_id} value={item.college_id}>{item.college_name}</option>)}</select></label>
          <label className="plan-field">Event type<select className="field" value={eventType} onChange={event => {
            const next = event.target.value as SagePlanEventType
            setEventType(next)
            if (next === 'virtual_session') setFormat('virtual')
          }}>{Object.entries(EVENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="plan-field">Date<input className="field" type="date" min={todayISO()} value={date} onChange={event => setDate(event.target.value)} /></label>
          <label className="plan-field">Time<input className="field" type="time" value={time} onChange={event => setTime(event.target.value)} /></label>
          <label className="plan-field">Format<select className="field" value={format} onChange={event => setFormat(event.target.value as SagePlanEventFormat)}><option value="in_person">In person</option><option value="virtual">Virtual</option></select></label>
          <label className="plan-field">{format === 'virtual' ? 'Meeting details' : 'Location'}<input className="field" value={location} onChange={event => setLocation(event.target.value)} placeholder={format === 'virtual' ? 'Zoom or portal details' : 'Admissions office or address'} /></label>
          <label className="plan-field plan-field-wide">Registration or event link<input className="field" type="url" value={registrationUrl} onChange={event => setRegistrationUrl(event.target.value)} placeholder="https://" /></label>
        </div>
        <div className="plan-checklist-preview">
          <div className="plan-section-heading"><div><h2><Check size={16} aria-hidden="true" /> What comes with it</h2><p>{preview.length ? `${preview.length} tasks, ready for the weekly plan.` : 'Choose a date to preview the checklist.'}</p></div></div>
          {preview.length > 0 && <ol>{preview.map(item => <li key={item.key}><span>{item.draft.title}</span><small>{item.draft.owner_role === 'parent' ? 'Parent' : 'Student'}</small></li>)}</ol>}
        </div>
        {!schools.length && <p className="form-error" role="alert">Save a school before adding its visit or interview.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="plan-flow-actions"><span>You can edit every generated task afterward.</span><button className="btn" onClick={() => void create()} disabled={!draft || saving}>{saving ? 'Building…' : 'Add event and checklist'}</button></div>
      </div>
    </Modal>
  )
}

export function VisitInterviewDetail({
  event,
  tasks,
  onClose,
  onSave,
  onOpenTask,
}: {
  event: SagePlanEvent
  tasks: SagePlanTask[]
  onClose: () => void
  onSave: (update: { questions: string[]; notes: string | null; status: SagePlanEventStatus }) => Promise<void>
  onOpenTask: (task: SagePlanTask) => void
}) {
  const [questions, setQuestions] = useState(event.questions.join('\n'))
  const [notes, setNotes] = useState(event.notes ?? '')
  const [status, setStatus] = useState(event.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const eventTasks = tasks.filter(task => task.event_id === event.id)
  const completed = eventTasks.filter(task => task.status === 'done').length
  async function save() {
    setSaving(true)
    setError('')
    try {
      await onSave({ questions: questions.split('\n').map(item => item.trim()).filter(Boolean), notes: notes.trim() || null, status })
    } catch {
      setError('Those changes didn’t save. Try again.')
      setSaving(false)
    }
  }
  return (
    <Modal onClose={onClose} labelledBy="event-detail-title" panelStyle={{ maxWidth: 740, padding: 0, maxHeight: '90vh' }}>
      <div className="frame-head">
        <div><span className="mini-title">{EVENT_LABELS[event.event_type]}</span><h2 id="event-detail-title" className="plan-modal-title">{event.college_name}</h2></div>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      <div className="plan-flow-body plan-event-detail">
        <div className="plan-event-summary">
          <CalendarDays size={21} aria-hidden="true" /><span><strong>{eventDateLabel(event)}</strong><small>{event.format === 'virtual' ? 'Virtual' : 'In person'}{event.location ? ` · ${event.location}` : ''}</small></span>
          {event.registration_url && <a className="pill" href={event.registration_url} target="_blank" rel="noopener noreferrer">Open event link</a>}
        </div>
        <label className="plan-field">Status<select className="field" value={status} onChange={item => setStatus(item.target.value as SagePlanEventStatus)}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="canceled">Canceled</option></select></label>
        <label className="plan-field">Questions to ask<textarea className="field" rows={5} value={questions} onChange={item => setQuestions(item.target.value)} /><small>One question per line. Keep the ones that will help you compare schools later.</small></label>
        <label className="plan-field">Follow-up notes<textarea className="field" rows={6} value={notes} onChange={item => setNotes(item.target.value)} placeholder="What felt energizing? What gave you pause? What should you follow up on?" /></label>
        <section className="plan-event-checklist">
          <div><h3><Clock3 size={15} aria-hidden="true" /> Preparation checklist</h3><span>{completed}/{eventTasks.length}</span></div>
          {eventTasks.map(task => <button key={task.id} onClick={() => onOpenTask(task)} className={task.status === 'done' ? 'is-done' : ''}><span>{task.status === 'done' && <Check size={13} aria-hidden="true" />}</span><strong>{task.title}</strong><ChevronRight size={14} aria-hidden="true" /></button>)}
        </section>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="plan-flow-actions"><span>Canceling skips any unfinished checklist tasks.</span><button className="btn" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save event'}</button></div>
      </div>
    </Modal>
  )
}
