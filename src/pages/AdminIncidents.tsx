import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

type ControlKey = 'welcome_email_enabled' | 'deadline_reminders_enabled' | 'email_programs_enabled'
interface Control { key: ControlKey; enabled: boolean; updated_at: string }
interface IncidentData { controls: Control[]; environment: Record<ControlKey, boolean>; maintenance: { maintenance_enabled: boolean; message: string | null; updated_at: string } }
const labels: Record<ControlKey, [string, string]> = {
  welcome_email_enabled: ['Welcome emails', 'One-time message after a new account is created.'],
  deadline_reminders_enabled: ['Deadline reminders', 'Scheduled 30-day and 7-day notices.'],
  email_programs_enabled: ['Guidance + digest', 'Getting-started notes and weekly saved-school digest.'],
}

export default function AdminIncidents() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<IncidentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    if (!user) return
    setLoading(true); setError(null)
    const { data: response, error: requestError } = await supabase.functions.invoke('email-operations', { body: { action: 'incident_controls' } })
    if (requestError) setError('Incident controls could not load.')
    else { const next = response as IncidentData; setData(next); setMessage(next.maintenance.message ?? '') }
    setLoading(false)
  }, [user])
  useEffect(() => { if (!authLoading && user) void load(); if (!authLoading && !user) setLoading(false) }, [authLoading, user, load])

  async function toggle(control: Control) {
    const enabled = !control.enabled
    if (!window.confirm(`${enabled ? 'Enable' : 'Pause'} ${labels[control.key][0]}? This change takes effect on the next run.`)) return
    const { error: requestError } = await supabase.functions.invoke('email-operations', { body: { action: 'update_incident_control', key: control.key, enabled } })
    if (requestError) setError('The control could not be updated.'); else await load()
  }
  async function saveMaintenance(enabled: boolean) {
    if (!window.confirm(`${enabled ? 'Publish' : 'Remove'} the maintenance notice?`)) return
    const { error: requestError } = await supabase.functions.invoke('email-operations', { body: { action: 'update_maintenance', enabled, message } })
    if (requestError) setError('The maintenance notice could not be updated.'); else await load()
  }

  if (authLoading || loading) return <div className="email-ops-page"><div className="mock-card section-pad">Checking access…</div></div>
  if (!user || !data) return <div className="email-ops-page"><div className="mock-card section-pad"><h1>Not authorized</h1><p>{error ?? 'You don’t have access to this page.'}</p></div></div>
  return <AdminShell><div className="admin-overview">
    <header className="email-ops-header"><div><span className="mini-title">Incident controls</span><h1>Pause safely. Communicate clearly.</h1><p>Database controls act immediately on the next email run. Environment switches remain a second, independent safeguard.</p></div><button className="btn secondary" onClick={() => void load()}><RefreshCw size={15} aria-hidden="true" />Refresh</button></header>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <section className="admin-control-grid" aria-label="Email program controls">{data.controls.map((control) => {
      const effective = control.enabled && data.environment[control.key]
      return <article className="mock-card section-pad admin-control-card" key={control.key}><div><span className="mini-title">{effective ? 'Running' : 'Paused'}</span><h2>{labels[control.key][0]}</h2><p>{labels[control.key][1]}</p><small>Server switch: {data.environment[control.key] ? 'enabled' : 'disabled'} · Admin control: {control.enabled ? 'enabled' : 'paused'}</small></div><button className={`btn ${control.enabled ? 'secondary' : 'primary'}`} onClick={() => void toggle(control)}>{control.enabled ? 'Pause' : 'Enable'}</button></article>
    })}</section>
    <section className="mock-card section-pad"><div className="email-ops-section-head"><div><span className="mini-title">Public status</span><h2>Maintenance notice</h2></div><ShieldAlert size={21} aria-hidden="true" /></div><p className="match-note">When active, this message appears above the main navigation for everyone.</p><form className="admin-maintenance-form" onSubmit={(event) => { event.preventDefault(); void saveMaintenance(true) }}><label htmlFor="maintenance-message">Message</label><textarea id="maintenance-message" maxLength={240} required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Some features are temporarily unavailable. We’re working on it." /><small>{message.length}/240 characters</small><div><button className="btn primary" type="submit">{data.maintenance.maintenance_enabled ? 'Update notice' : 'Publish notice'}</button>{data.maintenance.maintenance_enabled && <button className="btn secondary" type="button" onClick={() => void saveMaintenance(false)}>Remove notice</button>}</div></form></section>
  </div></AdminShell>
}
