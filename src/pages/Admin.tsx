import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, CheckCircle2, Clock3, Database, Gauge, RefreshCw, ShieldAlert } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

type HealthState = 'healthy' | 'attention' | 'paused'

interface WorkerHealth {
  label: string
  state: HealthState
  status: 'success' | 'failed' | 'disabled' | 'missing'
  finished_at: string | null
  sent_count: number
  failure_count: number
}

interface AdminOverview {
  admin: { email: string }
  generated_at: string
  overall: { state: 'healthy' | 'attention'; issue_count: number }
  ai_budget: {
    state: HealthState
    used: number
    limit: number
    remaining: number
    window_start: string | null
  }
  catalog: {
    state: HealthState
    source: string
    provider: string
    record_count: number
    last_refreshed_at: string | null
  }
  workers: Record<'email_programs' | 'deadline_reminders', WorkerHealth>
  issues: string[]
}

function formatTime(value: string | null) {
  if (!value) return 'No run recorded'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
}

function HealthPill({ state }: { state: HealthState | 'attention' }) {
  return <span className={`admin-health-pill ${state}`}>{state === 'attention' ? 'Needs attention' : state}</span>
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOverview = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: requestError } = await supabase.functions.invoke('email-operations', {
      body: { action: 'system_health' },
    })
    if (requestError) {
      const status = (requestError as { context?: { status?: number } }).context?.status
      setError(status === 401 || status === 403
        ? 'You don’t have access to this page.'
        : 'Admin health could not load. Try again in a moment.')
      setOverview(null)
    } else {
      setOverview(data as AdminOverview)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!authLoading && user) void loadOverview()
    if (!authLoading && !user) setLoading(false)
  }, [authLoading, user, loadOverview])

  const services = useMemo(() => overview ? [
    {
      key: 'ai', icon: Gauge, title: 'Sage AI budget', state: overview.ai_budget.state,
      value: `${overview.ai_budget.used} of ${overview.ai_budget.limit} requests`,
      detail: `${overview.ai_budget.remaining} remaining in the rolling window`,
    },
    {
      key: 'catalog', icon: Database, title: 'College catalog', state: overview.catalog.state,
      value: `${overview.catalog.record_count.toLocaleString()} schools`,
      detail: `Refreshed ${formatTime(overview.catalog.last_refreshed_at)}`,
    },
    ...Object.entries(overview.workers).map(([key, worker]) => ({
      key, icon: Clock3, title: worker.label, state: worker.state,
      value: worker.status === 'missing' ? 'No run recorded' : `Last run ${worker.status}`,
      detail: worker.finished_at
        ? `${formatTime(worker.finished_at)} · ${worker.sent_count} sent · ${worker.failure_count} failed`
        : 'Waiting for the first scheduled run',
    })),
  ] : [], [overview])

  if (authLoading || loading) {
    return <div className="email-ops-page"><div className="mock-card section-pad"><p className="match-note">Checking access…</p></div></div>
  }

  if (!user || (error && !overview)) {
    return <div className="email-ops-page"><div className="mock-card section-pad"><h1>Not authorized</h1><p className="match-note">{error ?? 'You don’t have access to this page.'}</p></div></div>
  }

  if (!overview) return null

  return (
    <AdminShell>
      <div className="admin-overview">
        <header className="email-ops-header">
          <div>
            <span className="mini-title">System health</span>
            <h1>Everything in one calm view.</h1>
            <p>See the signals that keep Admyt running without opening several dashboards.</p>
          </div>
          <button className="btn secondary" onClick={() => void loadOverview()} disabled={loading}>
            <RefreshCw size={15} aria-hidden="true" /> Refresh
          </button>
        </header>

        <section className={`admin-overall ${overview.overall.state}`} aria-label="Overall system health">
          {overview.overall.state === 'healthy'
            ? <CheckCircle2 size={24} aria-hidden="true" />
            : <ShieldAlert size={24} aria-hidden="true" />}
          <div>
            <strong>{overview.overall.state === 'healthy' ? 'All monitored systems look healthy.' : 'A few things need your attention.'}</strong>
            <span>{overview.overall.issue_count === 0 ? 'No active issues found.' : `${overview.overall.issue_count} active ${overview.overall.issue_count === 1 ? 'issue' : 'issues'} found.`}</span>
          </div>
          <HealthPill state={overview.overall.state} />
        </section>

        <section className="admin-health-grid" aria-label="Monitored services">
          {services.map(({ key, icon: Icon, title, state, value, detail }) => (
            <article className="mock-card admin-health-card" key={key}>
              <div className="admin-health-card-head"><Icon size={19} aria-hidden="true" /><HealthPill state={state} /></div>
              <h2>{title}</h2>
              <strong>{value}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </section>

        <section className="mock-card section-pad admin-issues">
          <div className="email-ops-section-head">
            <div><span className="mini-title">Attention queue</span><h2>What needs a closer look</h2></div>
            <Activity size={20} aria-hidden="true" />
          </div>
          {overview.issues.length > 0 ? (
            <ul>{overview.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
          ) : (
            <p className="match-note">Nothing is waiting on you right now.</p>
          )}
        </section>

        <p className="admin-generated">Last checked {formatTime(overview.generated_at)} · Signed in as {overview.admin.email}</p>
      </div>
    </AdminShell>
  )
}
