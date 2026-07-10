import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getCollege, getShortName } from '@/lib/colleges'
import type { College } from '@/lib/colleges'
import { useProfile } from '@/context/ProfileContext'
import { useAuth } from '@/context/AuthContext'
import AuthModal from '@/components/ui/AuthModal'
import { saveVibeCheck } from '@/lib/savedVibes'

interface VibeDimension {
  key: string
  label: string
  emoji: string
  score: number
  summary: string
}

interface VibeResult {
  dimensions: VibeDimension[]
  overallSummary: string
  fitScore: number
  scoreRationale?: string
}

const VIBE_DIMENSIONS = [
  { key: 'social', label: 'Social scene', emoji: '🎉', description: 'Parties, hangouts, campus events, and how easy it is to meet people.' },
  { key: 'athletics', label: 'Athletics & school spirit', emoji: '🏈', description: 'How much sports and school pride shape campus energy.' },
  { key: 'arts', label: 'Arts, music & creativity', emoji: '🎨', description: 'Music scenes, art programs, film culture, theater, and maker spaces.' },
  { key: 'political', label: 'Political & activist culture', emoji: '✊', description: 'Activism, organizing, protest culture, and civic involvement.' },
  { key: 'greekLife', label: 'Greek life', emoji: '🏛️', description: 'How central fraternities and sororities are to social life.' },
  { key: 'diversity', label: 'Diversity & inclusion', emoji: '🌍', description: 'Racial, cultural, socioeconomic, and identity-based diversity.' },
  { key: 'identity', label: 'Identity & belonging', emoji: '🫂', description: 'Whether students of your identity — LGBTQ+, religious, cultural, first-gen — find their people and feel they belong.' },
  { key: 'outdoor', label: 'Outdoor & nature access', emoji: '🏔️', description: 'Nature, hiking, outdoor recreation, and campus green space.' },
  { key: 'academic', label: 'Academic intensity', emoji: '📚', description: 'How rigorous and competitive the academic culture feels day to day.' },
  { key: 'community', label: 'Local community atmosphere', emoji: '🏘️', description: 'The relationship between campus and the surrounding town or city.' },
]

// True profile-based dimension inference needs a "what matters most" priorities
// field we do not capture yet, so this curated starter set is the honest interim.
const DEFAULT_VIBE_DIMENSION_KEYS = ['social', 'diversity', 'academic', 'community', 'arts']

function DimensionResult({ dim }: { dim: VibeDimension }) {
  return (
    <div className="mock-card section-pad">
      <div className="school-head">
        <div>
          <span className="mini-title">{dim.emoji} {dim.label}</span>
          <p className="match-note" style={{ marginTop: 8 }}>{dim.summary}</p>
        </div>
        <strong style={{ color: dim.score >= 8 ? 'var(--admyt-teal)' : 'var(--admyt-indigo)', fontSize: 22 }}>
          {dim.score}/10
        </strong>
      </div>
      <div className="bar" style={{ marginTop: 14 }}>
        <span style={{ width: `${dim.score * 10}%` }} />
      </div>
    </div>
  )
}

function formatPreferredSize(size?: 'small' | 'medium' | 'large' | null) {
  if (!size) return undefined
  return {
    small: 'small campus',
    medium: 'medium campus',
    large: 'large campus',
  }[size]
}

function formatPreferredInstitutionType(type?: 'two_year' | 'four_year' | 'either' | null) {
  if (!type) return undefined
  return {
    two_year: 'two-year',
    four_year: 'four-year',
    either: 'open to either',
  }[type]
}

function ProfileLensChips({ profile }: { profile: ReturnType<typeof useProfile>['profile'] }) {
  const chips = [
    profile?.intendedMajor,
    formatPreferredSize(profile?.preferredSize),
    formatPreferredInstitutionType(profile?.preferredInstitutionType),
    ...(profile?.preferredLocations ?? []),
    ...(profile?.careerGoals ?? []),
  ].filter((chip): chip is string => Boolean(chip?.trim()))

  if (chips.length === 0) return null

  return (
    <section className="profile-lens" aria-label="Profile lens">
      <span className="profile-lens-label">Reading this as:</span>
      <div className="profile-lens-chips">
        {chips.map((chip, index) => (
          <span className="pill profile-lens-chip" key={`${chip}-${index}`}>{chip}</span>
        ))}
      </div>
    </section>
  )
}

function LoadingDimensionRow({ dim }: { dim: typeof VIBE_DIMENSIONS[number] }) {
  return (
    <div className="vibe-loading-row">
      <span className="vibe-loading-icon" aria-hidden="true">{dim.emoji}</span>
      <span className="vibe-loading-label">{dim.label}</span>
      <span className="vibe-loading-bar" aria-hidden="true" />
    </div>
  )
}

export default function VibeCheck() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_VIBE_DIMENSION_KEYS))
  const [result, setResult] = useState<VibeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [college, setCollege] = useState<College | null>(null)
  const [collegeLoading, setCollegeLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setCollegeLoading(true)
    getCollege(id).then(data => { setCollege(data); setCollegeLoading(false) })
  }, [id])

  const selectedDimensions = VIBE_DIMENSIONS.filter(dim => selected.has(dim.key))
  const loadingStatuses = selectedDimensions.map(dim => `Reading the ${dim.label.toLowerCase()}...`)
  const loadingStatus = loadingStatuses[loadingStep % Math.max(loadingStatuses.length, 1)] ?? 'Reading the campus culture...'

  useEffect(() => {
    if (!loading || loadingStatuses.length === 0) return
    setLoadingStep(0)
    const timer = window.setInterval(() => {
      setLoadingStep(step => (step + 1) % loadingStatuses.length)
    }, 1800)
    return () => window.clearInterval(timer)
  }, [loading, loadingStatuses.length])

  function toggleDimension(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected(selected.size === VIBE_DIMENSIONS.length ? new Set() : new Set(VIBE_DIMENSIONS.map(d => d.key)))
  }

  async function handleSave() {
    if (!user || !result || !college) return
    setSaveLoading(true)
    setSaveError(null)
    const err = await saveVibeCheck({
      user_id: user.id,
      college_id: college.id,
      college_name: college.name,
      fit_score: result.fitScore,
      dimensions: result.dimensions,
      overall_summary: result.overallSummary,
    })
    if (err) setSaveError(err)
    else setSaved(true)
    setSaveLoading(false)
  }

  async function runVibeCheck() {
    if (selected.size === 0 || !college) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSaved(false)
    try {
      // The edge function owns the Vibe Check prompt; we send only the college id,
      // the selected dimension keys, and the student profile.
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'vibe',
          collegeId: college.id,
          dimensionKeys: Array.from(selected),
          profile: profile ?? undefined,
        }),
      })
      if (!resp.ok) throw new Error(`vibe request failed: ${resp.status}`)
      const data = await resp.json()
      const text = data.content?.[0]?.text ?? ''
      const parsed: VibeResult = JSON.parse(text.replace(/```json|```/g, '').trim())
      setResult(parsed)
    } catch (err) {
      setError("Hmm, something didn't work. Try it again in a second.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (collegeLoading) {
    return <div className="app-frame section-pad"><p className="match-note">Loading...</p></div>
  }

  if (!college) {
    return (
      <div className="app-frame section-pad" style={{ textAlign: 'center' }}>
        <p className="match-note">School not found.</p>
        <button className="btn secondary" onClick={() => navigate('/search')}>Back to search</button>
      </div>
    )
  }

  const schoolFirst = getShortName(college.name)
  const allSelected = selected.size === VIBE_DIMENSIONS.length

  return (
    <div className="app-frame">
      <div className="frame-head">
        <button className="crumb" onClick={() => navigate(`/college/${id}`)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
          <span>←</span>
          <span>Back to {schoolFirst}</span>
        </button>
        <span className="pill teal">Vibe Check</span>
      </div>

      {!result && !loading && (
        <div className="vibe-setup">
          <main>
            <section className="vibe-banner">
              <span className="pill dark">Campus culture, minus the brochure voice</span>
              <h1>Would you actually fit at {schoolFirst}?</h1>
              <p>Pick the parts of campus life that would actually change your decision. Sage will give you the honest read.</p>
            </section>

            <ProfileLensChips profile={profile} />

            <div className="dimension-grid">
              {VIBE_DIMENSIONS.map(dim => {
                const isSelected = selected.has(dim.key)
                return (
                  <button
                    key={dim.key}
                    className={`dimension ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleDimension(dim.key)}
                    type="button"
                  >
                    <strong>
                      <span>{dim.emoji} {dim.label}</span>
                      {isSelected && <span className="check">✓</span>}
                    </strong>
                    <p>{dim.description}</p>
                  </button>
                )
              })}
            </div>

            {error && <div className="callout" style={{ marginTop: 14, color: '#B42318' }}>{error}</div>}
          </main>

          <aside className="sage-panel">
            <section className="mock-soft-card section-pad">
              <span className="mini-title">Your setup</span>
              <h2 style={{ margin: '8px 0 8px', fontSize: 28, color: 'var(--admyt-ink)' }}>
                {selected.size} of {VIBE_DIMENSIONS.length}
              </h2>
              <p className="match-note">Focused is useful. Pick what you would actually care about after move-in day.</p>
              <button className="btn secondary" onClick={toggleSelectAll} style={{ marginTop: 14, width: '100%' }}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </section>

            <section className="callout">
              <strong>Ready when you are</strong>
              <p>Pick what matters to you, then I'll give it to you straight — the real read, not the brochure version.</p>
              <button className="btn" onClick={runVibeCheck} disabled={selected.size === 0} style={{ marginTop: 14, width: '100%', opacity: selected.size === 0 ? .55 : 1 }}>
                {selected.size === 0 ? 'Pick at least one' : `Run ${selected.size} dimension${selected.size === 1 ? '' : 's'}`}
              </button>
            </section>
          </aside>
        </div>
      )}

      {loading && (
        <div className="vibe-setup">
          <section className="result-card mock-card" style={{ gridColumn: '1 / -1' }}>
            <div>
              <span className="mini-title" style={{ color: 'var(--admyt-teal)' }}>Reading the campus culture</span>
              <h2 style={{ color: 'white', margin: '10px 0 0' }}>{schoolFirst}, through your lens</h2>
              <p>Sage is checking the dimensions you picked and turning the answer into a clean fit read.</p>
            </div>
            <div className="vibe-loading-panel" aria-live="polite">
              <div className="vibe-loading-status">{loadingStatus}</div>
              <div className="vibe-loading-list">
                {selectedDimensions.map(dim => <LoadingDimensionRow key={dim.key} dim={dim} />)}
              </div>
            </div>
          </section>
        </div>
      )}

      {result && (
        <div className="vibe-setup">
          <main style={{ display: 'grid', gap: 14 }}>
            <ProfileLensChips profile={profile} />

            <section className="result-card mock-card">
              <div>
                <span className="mini-title" style={{ color: 'var(--admyt-teal)' }}>Your fit score</span>
                <h1 style={{ color: 'white', margin: '10px 0 0' }}>{schoolFirst}'s real read</h1>
                <p>{result.overallSummary}</p>
                {result.scoreRationale && (
                  <p className="match-note" style={{ color: 'rgba(255,255,255,.72)', marginTop: 10 }}>
                    {result.scoreRationale}
                  </p>
                )}
              </div>
              <div className="big-score">{result.fitScore}<span>/ 100</span></div>
            </section>

            <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {result.dimensions.map(dim => <DimensionResult key={dim.key} dim={dim} />)}
            </div>
          </main>

          <aside className="sage-panel">
            <section className="callout">
              <strong>{saved ? 'Saved to your profile' : user ? 'Save this read' : "Don't lose this"}</strong>
              <p>{saved ? 'You can find it from Profile whenever you need it.' : 'Save this Vibe Check so Sage can use it later.'}</p>
              {user ? (
                !saved && (
                  <button className="btn" onClick={handleSave} disabled={saveLoading} style={{ marginTop: 14, width: '100%' }}>
                    {saveLoading ? 'Saving...' : 'Save results'}
                  </button>
                )
              ) : (
                <button className="btn" onClick={() => setShowAuthModal(true)} style={{ marginTop: 14, width: '100%' }}>
                  Save results
                </button>
              )}
            </section>

            {saveError && <div className="callout" style={{ color: '#B42318' }}>{saveError}</div>}

            <section className="mock-card section-pad">
              <span className="mini-title">Next moves</span>
              <div className="suggestion-list" style={{ marginTop: 12 }}>
                <button className="suggestion" onClick={() => { setResult(null); setError(null); setSaved(false) }}><p>Change what I'm checking</p></button>
                <button className="suggestion" onClick={runVibeCheck}><p>Run it again</p></button>
                <button className="suggestion" onClick={() => navigate('/chat')}><p>Ask Sage about this result</p></button>
                <button className="suggestion" onClick={() => navigate(`/college/${id}`)}><p>Back to {schoolFirst}</p></button>
              </div>
            </section>
          </aside>
        </div>
      )}

      {showAuthModal && (
        <AuthModal trigger="vibecheck" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}
