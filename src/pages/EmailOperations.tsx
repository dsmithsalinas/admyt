import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, CheckCircle2, Mail, RefreshCw, Send, ShieldAlert } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

type TemplateId = 'welcome' | 'deadline_reminder' | 'plan_reminder' | 'guidance_1' | 'guidance_2' | 'guidance_3' | 'weekly_digest'

interface TemplateSummary {
  id: TemplateId
  name: string
  description: string
}

interface Preview extends TemplateSummary {
  from: string
  subject: string
  html: string
  text: string
}

interface WorkerRun {
  worker: 'deadline_reminders' | 'email_programs'
  status: 'success' | 'failed' | 'disabled'
  metrics: Record<string, unknown>
  error_code: string | null
  finished_at: string
  duration_ms: number
}

interface Delivery {
  kind: string
  status: string
  provider_status: string | null
  error_code: string | null
  sent_at: string | null
  created_at: string
}

interface DeliveryEvent {
  event_type: string
  occurred_at: string
  received_at: string
}

interface Dashboard {
  admin: { email: string }
  templates: TemplateSummary[]
  summary: {
    opted_in: { deadline_reminders: number; plan_reminders: number; getting_started: number; weekly_digest: number }
    suppressions: {
      total: number
      by_reason: { bounce: number; complaint: number; provider_suppression: number; manual: number }
    }
    last_24_hours: {
      delivery_status: Record<'pending' | 'sent' | 'failed', number>
      provider_status: Record<'delivered' | 'bounced' | 'complained' | 'suppressed', number>
    }
  }
  runs: WorkerRun[]
  deliveries: Delivery[]
  events: DeliveryEvent[]
}

async function invokeOperations<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('email-operations', { body })
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status
    if (status === 403) throw new Error('This account does not have access to email operations.')
    if (status === 401) throw new Error('Sign in again to open email operations.')
    if (status === 503) throw new Error('Email operations is not configured yet.')
    throw new Error('Email operations could not load. Try again in a moment.')
  }
  return data as T
}

function formatTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
}

function metric(run: WorkerRun, key: string) {
  const value = run.metrics[key]
  return typeof value === 'number' ? value : 0
}

function StatusPill({ value }: { value: string | null }) {
  const tone = value === 'success' || value === 'sent' || value === 'delivered'
    ? 'success'
    : value === 'failed' || value === 'bounced' || value === 'complained' || value === 'suppressed'
      ? 'danger'
      : 'neutral'
  return <span className={`email-ops-status ${tone}`}>{value ?? 'waiting'}</span>
}

export default function EmailOperations() {
  const { user, loading: authLoading } = useAuth()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('welcome')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html')
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      setDashboard(await invokeOperations<Dashboard>({ action: 'dashboard' }))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Email operations could not load.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) void loadDashboard()
    if (!authLoading && !user) setLoading(false)
  }, [authLoading, user, loadDashboard])

  useEffect(() => {
    if (!dashboard) return
    let active = true
    setPreviewLoading(true)
    setMessage(null)
    void invokeOperations<{ preview: Preview }>({ action: 'preview', template: selectedTemplate })
      .then((result) => { if (active) setPreview(result.preview) })
      .catch((previewError) => { if (active) setError(previewError instanceof Error ? previewError.message : 'Preview could not load.') })
      .finally(() => { if (active) setPreviewLoading(false) })
    return () => { active = false }
  }, [dashboard, selectedTemplate])

  const latestRuns = useMemo(() => {
    const byWorker = new Map<string, WorkerRun>()
    for (const run of dashboard?.runs ?? []) if (!byWorker.has(run.worker)) byWorker.set(run.worker, run)
    return [...byWorker.values()]
  }, [dashboard])

  async function sendTest() {
    if (!preview) return
    setSending(true)
    setMessage(null)
    setError(null)
    try {
      const result = await invokeOperations<{ recipient: string }>({ action: 'send_test', template: preview.id })
      setMessage(`Test sent to ${result.recipient}.`)
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'The test email could not be sent.')
    } finally {
      setSending(false)
    }
  }

  if (authLoading || loading) {
    return <div className="email-ops-page"><div className="mock-card section-pad"><p className="match-note">Checking access…</p></div></div>
  }

  if (!user) {
    return <div className="email-ops-page"><div className="mock-card section-pad"><h1>Not authorized</h1><p className="match-note">You don’t have access to this page.</p></div></div>
  }

  if (error && !dashboard) {
    const denied = error.includes('does not have access') || error.includes('Sign in again')
    return <div className="email-ops-page"><div className="mock-card section-pad email-ops-access-error"><ShieldAlert size={24} /><h1>{denied ? 'Not authorized' : 'Admin tools unavailable'}</h1><p className="match-note">{denied ? 'You don’t have access to this page.' : error}</p></div></div>
  }

  if (!dashboard) return null
  const last24 = dashboard.summary.last_24_hours

  return (
    <AdminShell>
    <div className="email-ops-page">
      <header className="email-ops-header">
        <div>
          <span className="mini-title">Internal tools</span>
          <h1>Email operations</h1>
          <p>Preview the emails students receive, send a safe test to yourself, and see how the system is running.</p>
        </div>
        <button className="btn secondary" onClick={() => void loadDashboard()} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      {error && <div className="email-ops-notice danger" role="alert">{error}</div>}
      {message && <div className="email-ops-notice success" role="status">{message}</div>}

      <section className="email-ops-summary" aria-label="Email summary">
        <div className="mock-card email-ops-metric"><Mail size={18} /><span>Sent · 24 hours</span><strong>{last24.delivery_status.sent}</strong></div>
        <div className="mock-card email-ops-metric"><CheckCircle2 size={18} /><span>Delivered · 24 hours</span><strong>{last24.provider_status.delivered}</strong></div>
        <div className="mock-card email-ops-metric"><ShieldAlert size={18} /><span>Failed or bounced</span><strong>{last24.delivery_status.failed + last24.provider_status.bounced}</strong></div>
        <div className="mock-card email-ops-metric"><Activity size={18} /><span>Suppressed addresses</span><strong>{dashboard.summary.suppressions.total}</strong></div>
      </section>

      <section className="mock-card section-pad email-ops-studio">
        <div className="email-ops-section-head">
          <div><span className="mini-title">Template studio</span><h2>See exactly what goes out.</h2></div>
          <button className="btn" onClick={() => void sendTest()} disabled={!preview || sending}>
            <Send size={15} /> {sending ? 'Sending…' : 'Send test to me'}
          </button>
        </div>
        <div className="email-ops-studio-grid">
          <nav className="email-ops-template-list" aria-label="Email templates">
            {dashboard.templates.map((template) => (
              <button
                key={template.id}
                className={template.id === selectedTemplate ? 'active' : ''}
                onClick={() => setSelectedTemplate(template.id)}
                aria-pressed={template.id === selectedTemplate}
              >
                <strong>{template.name}</strong>
                <span>{template.description}</span>
              </button>
            ))}
          </nav>
          <div className="email-ops-preview">
            {previewLoading || !preview ? <p className="match-note">Building preview…</p> : (
              <>
                <div className="email-ops-envelope">
                  <div><span>From</span><strong>{preview.from}</strong></div>
                  <div><span>Subject</span><strong>{preview.subject}</strong></div>
                </div>
                <div className="email-ops-preview-tabs">
                  <button className={previewMode === 'html' ? 'active' : ''} onClick={() => setPreviewMode('html')}>Rendered email</button>
                  <button className={previewMode === 'text' ? 'active' : ''} onClick={() => setPreviewMode('text')}>Plain text</button>
                </div>
                {previewMode === 'html' ? (
                  <iframe title={`${preview.name} email preview`} sandbox="" srcDoc={preview.html} />
                ) : (
                  <pre>{preview.text}</pre>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="email-ops-grid">
        <div className="mock-card section-pad">
          <span className="mini-title">Current audience</span>
          <h2>Optional email opt-ins</h2>
          <div className="email-ops-audience">
            <div><span>Deadline reminders</span><strong>{dashboard.summary.opted_in.deadline_reminders}</strong></div>
            <div><span>Sage Plan reminders</span><strong>{dashboard.summary.opted_in.plan_reminders}</strong></div>
            <div><span>Getting-started guidance</span><strong>{dashboard.summary.opted_in.getting_started}</strong></div>
            <div><span>Weekly digest</span><strong>{dashboard.summary.opted_in.weekly_digest}</strong></div>
          </div>
          <h3 className="email-ops-subheading">Suppression reasons</h3>
          <div className="email-ops-event-list">
            <div><span>Bounces</span><strong>{dashboard.summary.suppressions.by_reason.bounce}</strong></div>
            <div><span>Complaints</span><strong>{dashboard.summary.suppressions.by_reason.complaint}</strong></div>
            <div><span>Provider</span><strong>{dashboard.summary.suppressions.by_reason.provider_suppression}</strong></div>
            <div><span>Manual</span><strong>{dashboard.summary.suppressions.by_reason.manual}</strong></div>
          </div>
        </div>
        <div className="mock-card section-pad">
          <span className="mini-title">Latest worker health</span>
          <h2>Scheduled runs</h2>
          <div className="email-ops-worker-list">
            {latestRuns.map((run) => (
              <div key={run.worker}>
                <div><strong>{run.worker === 'email_programs' ? 'Guidance + digest' : 'Deadline reminders'}</strong><span>{formatTime(run.finished_at)}</span></div>
                <StatusPill value={run.status} />
                <span>{metric(run, 'users_considered')} considered · {metric(run, 'skipped_count')} skipped · {metric(run, 'sent_count')} sent · {metric(run, 'failure_count')} failed · {metric(run, 'suppressed_count')} suppressed · {run.duration_ms} ms</span>
              </div>
            ))}
            {latestRuns.length === 0 && <p className="match-note">No scheduled runs have been recorded yet.</p>}
          </div>
        </div>
      </section>

      <section className="mock-card section-pad">
        <div className="email-ops-section-head"><div><span className="mini-title">Recent activity</span><h2>Delivery ledger</h2></div><span className="match-note">No recipient addresses are shown.</span></div>
        <div className="email-ops-table-wrap">
          <table className="email-ops-table">
            <thead><tr><th>Email</th><th>App status</th><th>Provider</th><th>Time</th></tr></thead>
            <tbody>
              {dashboard.deliveries.map((delivery, index) => (
                <tr key={`${delivery.created_at}-${index}`}>
                  <td>{delivery.kind.replace(/_/g, ' ')}</td>
                  <td><StatusPill value={delivery.status} />{delivery.error_code && <small>{delivery.error_code}</small>}</td>
                  <td><StatusPill value={delivery.provider_status} /></td>
                  <td>{formatTime(delivery.sent_at ?? delivery.created_at)}</td>
                </tr>
              ))}
              {dashboard.deliveries.length === 0 && <tr><td colSpan={4}>No application emails have been recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mock-card section-pad">
        <span className="mini-title">Provider events</span>
        <h2>Resend webhook activity</h2>
        <div className="email-ops-event-list">
          {dashboard.events.slice(0, 12).map((event, index) => (
            <div key={`${event.received_at}-${index}`}><StatusPill value={event.event_type.replace('email.', '')} /><span>{formatTime(event.occurred_at)}</span></div>
          ))}
          {dashboard.events.length === 0 && <p className="match-note">No webhook events have been recorded yet.</p>}
        </div>
      </section>
    </div>
    </AdminShell>
  )
}
