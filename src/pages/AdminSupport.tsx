import { FormEvent, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface SupportResult {
  found: boolean
  user?: { id: string; email: string; created_at: string; last_sign_in_at: string | null; email_confirmed_at: string | null }
  counts?: { messages: number; saved_schools: number; vibe_checks: number }
  profile?: { exists: boolean; updated_at: string | null }
  email_preferences?: { deadline_reminders_enabled: boolean; getting_started_enabled: boolean; weekly_digest_enabled: boolean; timezone: string; updated_at: string } | null
  suppression?: { reason: string; created_at: string } | null
  deliveries?: Array<{ kind: string; status: string; provider_status: string | null; error_code: string | null; sent_at: string | null; created_at: string }>
}

const when = (value?: string | null) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Never'

export default function AdminSupport() {
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<SupportResult | null>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    if (authLoading) return
    if (!user) { setAccess('denied'); return }
    void supabase.functions.invoke('email-operations', { body: { action: 'admin_access' } })
      .then(({ error: requestError }) => setAccess(requestError ? 'denied' : 'allowed'))
  }, [authLoading, user])

  async function lookup(event: FormEvent) {
    event.preventDefault()
    setWorking(true); setError(null); setResult(null)
    const { data, error: requestError } = await supabase.functions.invoke('email-operations', { body: { action: 'support_lookup', email } })
    if (requestError) setError('The account lookup could not be completed.')
    else setResult(data as SupportResult)
    setWorking(false)
  }

  if (authLoading || access === 'checking') return <div className="email-ops-page"><div className="mock-card section-pad">Checking access…</div></div>
  if (!user || access === 'denied') return <div className="email-ops-page"><div className="mock-card section-pad"><h1>Not authorized</h1><p>You don’t have access to this page.</p></div></div>

  return <AdminShell><div className="admin-overview">
    <header className="email-ops-header"><div><span className="mini-title">User support</span><h1>Find one account, safely.</h1><p>Enter an exact email address. This tool shows operational status and counts, never message or profile content.</p></div></header>
    <section className="mock-card section-pad">
      <form className="admin-support-form" onSubmit={lookup}>
        <label htmlFor="support-email">Account email</label>
        <div><input id="support-email" type="email" required autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@example.com" /><button className="btn primary" disabled={working}><Search size={15} aria-hidden="true" />{working ? 'Looking…' : 'Look up'}</button></div>
      </form>
      {error && <p role="alert" className="admin-error">{error}</p>}
      {result && !result.found && <p className="match-note" role="status">No account matches that exact email address.</p>}
    </section>
    {result?.found && result.user && <>
      <section className="admin-health-grid" aria-label="Account summary">
        <article className="mock-card admin-health-card"><h2>Account</h2><strong>{result.user.email}</strong><p>Created {when(result.user.created_at)}<br />Last sign-in {when(result.user.last_sign_in_at)}</p></article>
        <article className="mock-card admin-health-card"><h2>Saved schools</h2><strong>{result.counts?.saved_schools ?? 0}</strong><p>{result.counts?.vibe_checks ?? 0} saved Vibe Checks</p></article>
        <article className="mock-card admin-health-card"><h2>Sage activity</h2><strong>{result.counts?.messages ?? 0}</strong><p>Messages stored; content stays private</p></article>
        <article className="mock-card admin-health-card"><h2>Email status</h2><strong>{result.suppression ? 'Suppressed' : 'Sendable'}</strong><p>{result.suppression ? `Reason: ${result.suppression.reason}` : 'No suppression on file'}</p></article>
      </section>
      <section className="mock-card section-pad"><span className="mini-title">Email preferences</span><h2>Current choices</h2>{result.email_preferences ? <dl className="admin-detail-list"><div><dt>Deadline reminders</dt><dd>{result.email_preferences.deadline_reminders_enabled ? 'On' : 'Off'}</dd></div><div><dt>Getting-started guidance</dt><dd>{result.email_preferences.getting_started_enabled ? 'On' : 'Off'}</dd></div><div><dt>Weekly digest</dt><dd>{result.email_preferences.weekly_digest_enabled ? 'On' : 'Off'}</dd></div><div><dt>Timezone</dt><dd>{result.email_preferences.timezone}</dd></div></dl> : <p className="match-note">No email preferences saved.</p>}</section>
      <section className="mock-card section-pad"><span className="mini-title">Recent delivery attempts</span><h2>Last 10 emails</h2>{result.deliveries?.length ? <div className="email-ops-table-wrap"><table className="email-ops-table"><thead><tr><th>Program</th><th>Status</th><th>Provider</th><th>When</th></tr></thead><tbody>{result.deliveries.map((delivery, index) => <tr key={`${delivery.created_at}-${index}`}><td>{delivery.kind}</td><td>{delivery.status}{delivery.error_code ? ` · ${delivery.error_code}` : ''}</td><td>{delivery.provider_status ?? '—'}</td><td>{when(delivery.sent_at ?? delivery.created_at)}</td></tr>)}</tbody></table></div> : <p className="match-note">No delivery attempts recorded.</p>}</section>
    </>}
  </div></AdminShell>
}
