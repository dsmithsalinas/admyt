import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCollegeCatalogStatus } from '@/lib/colleges'

function formatDate(value: string | null) {
  if (!value) return 'Refresh date unavailable'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DataAndPrivacy() {
  const [catalogStatus, setCatalogStatus] = useState<{ lastRefreshedAt: string; recordCount: number } | null>(null)

  useEffect(() => {
    getCollegeCatalogStatus().then(setCatalogStatus).catch(() => setCatalogStatus(null))
  }, [])

  return (
    <div className="app-frame trust-page">
      <header className="trust-hero">
        <span className="pill dark">Data & privacy</span>
        <h1>Your data, in plain English.</h1>
        <p>No mystery language. Here’s what Admyt uses, what the numbers mean, and what stays in your control.</p>
      </header>

      <div className="trust-grid">
        <section className="mock-card section-pad trust-card">
          <span className="mini-title">Sage is AI</span>
          <h2>A helpful starting point—not the final word.</h2>
          <p>
            When you chat with Sage or run a Vibe Check, the relevant text, school context, and preferences are sent to Anthropic to generate your response. AI can miss context or get facts wrong.
          </p>
          <p>Confirm deadlines, costs, admissions requirements, and other big decisions with the school or a trusted human.</p>
        </section>

        <section className="mock-card section-pad trust-card">
          <span className="mini-title">What Fit Scores mean</span>
          <h2>A conversation starter, not an admissions prediction.</h2>
          <p>
            A Fit Score compares what you’ve told Sage with the school information Admyt has. It is not your chance of admission, a guarantee you’ll be happy, or a ranking of your worth.
          </p>
          <p>Vibe Check is also AI-generated. Use it to find better questions—not to replace a visit or a real conversation with students.</p>
        </section>

        <section className="mock-card section-pad trust-card">
          <span className="mini-title">Where school facts come from</span>
          <h2>College Scorecard, with the rough edges left visible.</h2>
          <p>
            Catalog facts come from the U.S. Department of Education’s{' '}
            <a href="https://collegescorecard.ed.gov/data/" target="_blank" rel="noopener noreferrer">College Scorecard</a>.
            Published data can lag behind a school’s current website.
          </p>
          <p>
            {catalogStatus
              ? `Catalog refreshed ${formatDate(catalogStatus.lastRefreshedAt)} · ${catalogStatus.recordCount.toLocaleString()} schools.`
              : 'Catalog refresh information is temporarily unavailable.'}
          </p>
        </section>

        <section className="mock-card section-pad trust-card">
          <span className="mini-title">What Admyt keeps</span>
          <h2>Only what helps you pick up where you left off.</h2>
          <p>
            Guests keep hearts, preferences, and up to three Vibe Checks in this browser. Signed-in accounts store conversation history, saved schools, Vibe Checks, preferences, and Sage Plan tasks, visits and interviews, preparation questions, follow-up notes, weekly choices, blockers, ownership, and application stages in Supabase.
          </p>
          <p>
            Account data stays in the live product until you delete your account. Deletion removes it from the live application immediately. Copies can remain in encrypted disaster-recovery backups for up to 7 days before aging out.
          </p>
        </section>
      </div>

      <section className="callout trust-control-card">
        <div>
          <strong>You stay in control.</strong>
          <p>Download your Admyt data or permanently delete your account from your profile.</p>
        </div>
        <Link className="btn" to="/profile">Go to my profile</Link>
      </section>

      <nav className="legal-sibling-links" aria-label="Policies">
        <Link to="/privacy">Read the full Privacy Policy</Link>
        <Link to="/terms">Read the Terms of Use</Link>
      </nav>
    </div>
  )
}
