import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Activity, Mail } from 'lucide-react'

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
        </nav>
      </div>
      {children}
    </div>
  )
}
