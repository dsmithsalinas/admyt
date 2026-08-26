import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface AuditEvent { id: string; admin_email: string; action: string; target_type: string | null; target_id: string | null; outcome: string; created_at: string }

export default function AdminAudit() {
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const load = useCallback(async () => {
    if (!user) return
    setLoading(true); setError(false)
    const { data, error: requestError } = await supabase.functions.invoke('email-operations', { body: { action: 'audit_log' } })
    if (requestError) setError(true); else setEvents((data as { events: AuditEvent[] }).events)
    setLoading(false)
  }, [user])
  useEffect(() => { if (!authLoading && user) void load(); if (!authLoading && !user) setLoading(false) }, [authLoading, user, load])
  if (authLoading || loading) return <div className="email-ops-page"><div className="mock-card section-pad">Checking access…</div></div>
  if (!user || error) return <div className="email-ops-page"><div className="mock-card section-pad"><h1>Not authorized</h1><p>{error ? 'The audit log could not load.' : 'You don’t have access to this page.'}</p></div></div>
  return <AdminShell><div className="admin-overview"><header className="email-ops-header"><div><span className="mini-title">Accountability</span><h1>Admin audit log.</h1><p>The 100 most recent sensitive admin actions, newest first.</p></div><button className="btn secondary" onClick={() => void load()}><RefreshCw size={15} aria-hidden="true" />Refresh</button></header><section className="mock-card section-pad">{events.length ? <div className="email-ops-table-wrap"><table className="email-ops-table"><thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Target</th><th>Outcome</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{new Date(event.created_at).toLocaleString()}</td><td>{event.admin_email}</td><td>{event.action}</td><td>{event.target_type ? `${event.target_type}: ${event.target_id ?? 'not found'}` : '—'}</td><td>{event.outcome}</td></tr>)}</tbody></table></div> : <p className="match-note">No audited actions yet.</p>}</section></div></AdminShell>
}
