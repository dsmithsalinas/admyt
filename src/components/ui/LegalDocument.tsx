import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="legal-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}
export default function LegalDocument({
  eyebrow,
  title,
  effectiveDate,
  summary,
  children,
}: {
  eyebrow: string
  title: string
  effectiveDate: string
  summary: ReactNode
  children: ReactNode
}) {
  return (
    <article className="app-frame legal-page">
      <header className="legal-hero">
        <span className="pill dark">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="legal-effective">Effective {effectiveDate}</p>
        <div className="legal-summary">{summary}</div>
        <nav className="legal-sibling-links" aria-label="Legal documents">
          <Link to="/terms">Terms of Use</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/data-and-privacy">Data & privacy overview</Link>
        </nav>
      </header>
      <div className="legal-content">{children}</div>
    </article>
  )
}
