import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Activity, CalendarSearch, Mail, Search, ShieldAlert, ScrollText } from 'lucide-react'

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <div className="admin-shell-bar">
        <div>
          <span className="mini-title">Internal tools</span>
          <strong>Admyt admin</strong>
        </div>
        <nav className="admin-shell-nav" aria-label="Admin tools">
          <NavLink to="/admin" end>
            <Activity size={16} aria-hidden="true" /> Overview
          </NavLink>
          <NavLink to="/email-operations">
            <Mail size={16} aria-hidden="true" /> Email operations
          </NavLink>
          <NavLink to="/admin/data-quality">
            <CalendarSearch size={16} aria-hidden="true" /> Data quality
          </NavLink>
          <NavLink to="/admin/support">
            <Search size={16} aria-hidden="true" /> User support
          </NavLink>
          <NavLink to="/admin/incidents">
            <ShieldAlert size={16} aria-hidden="true" /> Incident controls
          </NavLink>
          <NavLink to="/admin/audit">
            <ScrollText size={16} aria-hidden="true" /> Audit log
          </NavLink>
        </nav>
      </div>
      {children}
    </div>
  )
}
