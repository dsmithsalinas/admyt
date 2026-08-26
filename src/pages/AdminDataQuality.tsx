import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, Database, ExternalLink, Heart, Link2Off, RefreshCw } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

type QualityState = 'stale' | 'missing_source' | 'missing'

interface QualitySchool {
  college_id: string
  college_name: string
  saved_count: number
  state: QualityState
  updated_at: string | null
  source_url: string | null
  round_count: number
}

interface DataQualityReport {
  admin: { email: string }
  generated_at: string
  summary: {
    saved_school_records: number
    unique_saved_schools: number
    verified: number
    stale: number
    missing_source: number
    missing: number
  }
  catalog: {
    source: string
    provider: string
    record_count: number
    last_refreshed_at: string | null
  }
  schools: QualitySchool[]
}

function formatTime(value: string | null) {
  if (!value) return 'Never checked'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
}

function stateLabel(state: QualityState) {
  if (state === 'missing_source') return 'Source missing'
  if (state === 'missing') return 'Deadline missing'
  return 'Needs recheck'
}

export default function AdminDataQuality() {
  const { user, loading: authLoading } = useAuth()
  const [report, setReport] = useState<DataQualityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | QualityState>('all')

  const loadReport = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: requestError } = await supabase.functions.invoke('email-operations', {
      body: { action: 'data_quality' },
    })
    if (requestError) {
      const status = (requestError as { context?: { status?: number } }).context?.status
      setError(status === 401 || status === 403
        ? 'You don’t have access to this page.'
        : 'Data quality could not load. Try again in a moment.')
      setReport(null)
    } else {
      setReport(data as DataQualityReport)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!authLoading && user) void loadReport()
    if (!authLoading && !user) setLoading(false)
  }, [authLoading, user, loadReport])

  const visibleSchools = useMemo(() => report?.schools.filter((school) => filter === 'all' || school.state === filter) ?? [], [report, filter])

  if (authLoading || loading) {
    return <div className="email-ops-page"><div className="mock-card section-pad"><p className="match-note">Checking access…</p></div></div>
  }

  if (!user || (error && !report)) {
    return <div className="email-ops-page"><div className="mock-card section-pad"><h1>Not authorized</h1><p className="match-note">{error ?? 'You don’t have access to this page.'}</p></div></div>
  }

  if (!report) return null

  const problemCount = report.summary.stale + report.summary.missing_source + report.summary.missing

  return (
    <AdminShell>
      <div className="admin-overview">
        <header className="email-ops-header">
          <div>
            <span className="mini-title">College data</span>
            <h1>Deadline quality, without the digging.</h1>
            <p>Review the saved schools whose deadline data cannot currently support verified reminders and digest dates.</p>
          </div>
          <button className="btn secondary" onClick={() => void loadReport()} disabled={loading}>
            <RefreshCw size={15} aria-hidden="true" /> Refresh
          </button>
        </header>

        <section className="admin-health-grid" aria-label="Deadline quality summary">
          <article className="mock-card admin-health-card"><Heart size={19} aria-hidden="true" /><h2>Saved-school coverage</h2><strong>{report.summary.unique_saved_schools}</strong><p>{report.summary.saved_school_records} saves across all accounts</p></article>
          <article className="mock-card admin-health-card"><CalendarClock size={19} aria-hidden="true" /><h2>Verified and current</h2><strong>{report.summary.verified}</strong><p>Checked within seven days with an HTTPS source</p></article>
          <article className="mock-card admin-health-card"><RefreshCw size={19} aria-hidden="true" /><h2>Needs recheck</h2><strong>{report.summary.stale}</strong><p>Usable data that is too old for email</p></article>
          <article className="mock-card admin-health-card"><Link2Off size={19} aria-hidden="true" /><h2>Missing data</h2><strong>{report.summary.missing + report.summary.missing_source}</strong><p>Missing deadlines or an official source</p></article>
        </section>

        <section className="mock-card section-pad admin-catalog-summary">
          <Database size={21} aria-hidden="true" />
          <div><span className="mini-title">Catalog source</span><h2>{report.catalog.record_count.toLocaleString()} College Scorecard schools</h2><p>{report.catalog.provider} · Refreshed {formatTime(report.catalog.last_refreshed_at)}</p></div>
        </section>

        <section className="mock-card section-pad admin-quality-queue">
          <div className="email-ops-section-head">
            <div><span className="mini-title">Review queue</span><h2>{problemCount === 0 ? 'Nothing needs attention' : `${problemCount} ${problemCount === 1 ? 'school needs' : 'schools need'} attention`}</h2></div>
            <div className="admin-quality-filters" role="group" aria-label="Filter deadline issues">
              {([
                ['all', 'All'], ['stale', 'Recheck'], ['missing_source', 'Source'], ['missing', 'Missing'],
              ] as const).map(([value, label]) => (
                <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value}>{label}</button>
              ))}
            </div>
          </div>

          {visibleSchools.length > 0 ? (
            <div className="email-ops-table-wrap">
              <table className="email-ops-table admin-quality-table">
                <thead><tr><th>School</th><th>Status</th><th>Last checked</th><th>Source</th></tr></thead>
                <tbody>
                  {visibleSchools.map((school) => (
                    <tr key={school.college_id}>
                      <td><strong>{school.college_name}</strong><small>{school.saved_count} {school.saved_count === 1 ? 'save' : 'saves'} · {school.round_count} deadline {school.round_count === 1 ? 'round' : 'rounds'}</small></td>
                      <td><span className={`admin-quality-state ${school.state}`}>{stateLabel(school.state)}</span></td>
                      <td>{formatTime(school.updated_at)}</td>
                      <td>{school.source_url ? <a href={school.source_url} target="_blank" rel="noreferrer">Official source <ExternalLink size={13} aria-hidden="true" /></a> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="match-note">No schools match this filter.</p>
          )}
        </section>

        <p className="admin-generated">Last checked {formatTime(report.generated_at)} · Signed in as {report.admin.email}</p>
      </div>
    </AdminShell>
  )
}
