import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getCollege, getShortName, typeLabel } from '@/lib/colleges'
import type { College } from '@/lib/colleges'
import { useProfile } from '@/context/ProfileContext'
import { useChatContext } from '@/context/ChatContext'
import { scoreCollege, explainFit } from '@/lib/matchScore'
import { orderMajorsForProfile } from '@/lib/majors'
import HeartButton from '@/components/ui/HeartButton'

function matchLabel(score: number) {
  if (score >= 85) return 'Strong fit'
  if (score >= 70) return 'Worth a close look'
  return 'Useful comparison'
}

function formatStat(value: string | number | null | undefined, fallback = 'Not listed') {
  if (value == null || value === '') return fallback
  return typeof value === 'number' ? value.toLocaleString() : value
}

export default function CollegeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { heartedSchools, toggleHeart } = useChatContext()
  const [college, setCollege] = useState<College | null>(null)
  const [loading, setLoading] = useState(true)
  const [descriptionLoading, setDescriptionLoading] = useState(false)
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setGeneratedDescription(null)
    getCollege(id).then(data => { setCollege(data); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!college || college.description) return

    async function generateDescription() {
      if (!college) return
      setDescriptionLoading(true)
      try {
        // The edge function builds the prompt from the college id, generates the
        // description, and caches it server-side (service role).
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ type: 'description', collegeId: college.id }),
        })

        if (!resp.ok) throw new Error(`chat function error: ${resp.status}`)
        const data = await resp.json()
        const description = data?.content?.[0]?.text?.trim()

        if (description) {
          setGeneratedDescription(description)
        }
      } catch (err) {
        console.error('Failed to generate description:', err)
      } finally {
        setDescriptionLoading(false)
      }
    }

    generateDescription()
  }, [college])

  if (loading) {
    return (
      <div className="app-frame section-pad">
        <div className="mock-card" style={{ height: 220, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        <style>{`@keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </div>
    )
  }

  if (!college) {
    return (
      <div className="app-frame section-pad" style={{ textAlign: 'center' }}>
        <p className="match-note">School not found.</p>
        <button className="btn secondary" onClick={() => navigate('/search')}>Back to search</button>
      </div>
    )
  }

  const score = scoreCollege(college, profile)
  const tuition = college.tuitionInState ?? college.tuitionOutState
  const isHearted = heartedSchools.has(college.id)
  const reasons = explainFit(college, profile).slice(0, 3)
  const orderedMajors = orderMajorsForProfile(college.majors, profile)
  const shortName = getShortName(college.name)
  const watchOut = [
    tuition != null && tuition > 45000 ? 'Worth a real look at the cost before you fall for it.' : null,
    college.acceptanceRate != null && college.acceptanceRate < 25 ? 'Admissions are selective, so keep a balanced list.'
      : null,
    'Culture matters here. Run a Vibe Check before this turns into a favorite.',
  ].filter(Boolean) as string[]

  return (
    <div className="app-frame">
      <div className="frame-head">
        <button className="crumb" onClick={() => navigate('/search')} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
          <span>←</span>
          <span>Back to results</span>
        </button>
        <button className="btn secondary" onClick={() => navigate(`/college/${college.id}/vibe`)}>
          Run Vibe Check
        </button>
      </div>

      <section className="detail-hero">
        <div>
          <div className="filters">
            <span className="pill dark">{typeLabel(college.type)}</span>
            <span className="pill dark">{college.size.charAt(0).toUpperCase() + college.size.slice(1)}</span>
            <span className="pill dark">{college.state}</span>
          </div>
          <h1>{college.name}</h1>
          <p>{college.location}</p>
          <div className="stat-grid">
            <div className="stat"><span>Admit rate</span><strong>{college.acceptanceRate != null ? `${college.acceptanceRate}%` : 'TBD'}</strong></div>
            <div className="stat"><span>Tuition</span><strong>{tuition != null ? `$${Math.round(tuition / 1000)}k` : 'TBD'}</strong></div>
            <div className="stat"><span>Enrollment</span><strong>{formatStat(college.enrollment)}</strong></div>
          </div>
        </div>

        <aside className="fit-card">
          <div className="school-head">
            <div>
              <span className="mini-title">Sage fit read</span>
              <h3 style={{ margin: '6px 0', fontSize: 24 }}>{matchLabel(score)}</h3>
              <p className="match-note">Based on what Sage knows so far. More conversation makes this sharper.</p>
            </div>
            <HeartButton active={isHearted} onClick={() => toggleHeart(college)} size={38} />
          </div>
          <div className="score" style={{ width: 92, height: 92, marginTop: 18, background: `conic-gradient(var(--admyt-teal) 0 ${score}%, #eeeaf8 ${score}% 100%)` }}>
            <strong style={{ width: 70, height: 70, fontSize: 24 }}>{score}</strong>
          </div>
        </aside>
      </section>

      <div className="detail-body">
        <main style={{ display: 'grid', gap: 14 }}>
          <section className="mock-card section-pad">
            <span className="mini-title">Real-talk summary</span>
            {descriptionLoading ? (
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {[100, 84, 58].map(w => <div key={w} style={{ height: 12, width: `${w}%`, borderRadius: 999, background: '#eeeaf8' }} />)}
              </div>
            ) : (
              <p className="match-note" style={{ marginTop: 10, fontSize: 15, lineHeight: 1.7 }}>
                {college.description ?? generatedDescription ?? `${college.name} is a ${college.type} ${college.size} school in ${college.location}. Sage can help you compare the academics, cost, and culture against the kind of place where you'd actually thrive.`}
              </p>
            )}
          </section>

          <div className="two-list">
            <section className="mock-card section-pad">
              <span className="mini-title">Could fit because</span>
              <div className="learn-list" style={{ marginTop: 12 }}>
                {reasons.map(reason => <div className="suggestion" key={reason}><p>{reason}</p></div>)}
              </div>
            </section>
            <section className="mock-card section-pad">
              <span className="mini-title">Watch out for</span>
              <div className="learn-list" style={{ marginTop: 12 }}>
                {watchOut.map(item => <div className="suggestion" key={item}><p>{item}</p></div>)}
              </div>
            </section>
          </div>

          {orderedMajors.length > 0 && (
            <section className="mock-card section-pad">
              <span className="mini-title">Programs that might matter</span>
              <div className="filters" style={{ marginTop: 12 }}>
                {orderedMajors.map(major => <span className="pill" key={major}>{major}</span>)}
              </div>
            </section>
          )}
        </main>

        <aside className="sage-panel">
          <section className="mock-soft-card section-pad">
            <span className="mini-title">Ask Sage</span>
            <div className="suggestion-list" style={{ marginTop: 12 }}>
              {[
                `Is ${shortName} actually a fit for me?`,
                `Show me schools like ${shortName} but more affordable.`,
                `What should I compare against ${shortName}?`,
              ].map(prompt => (
                <button className="suggestion" key={prompt} onClick={() => navigate('/chat')} style={{ cursor: 'pointer', textAlign: 'left' }}>
                  <p>{prompt}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="callout">
            <strong>Vibe Check</strong>
            <p>Does {shortName}'s culture actually fit your day-to-day life?</p>
            <button className="btn" onClick={() => navigate(`/college/${college.id}/vibe`)} style={{ marginTop: 14, width: '100%' }}>
              Check the vibe
            </button>
          </section>

          <section className="mock-card section-pad">
            <span className="mini-title">Quick stats</span>
            <div className="learn-list" style={{ marginTop: 12 }}>
              <div className="learn-item"><span>Average GPA</span><span>{college.avgGpa?.toFixed(2) ?? 'TBD'}</span></div>
              <div className="learn-item"><span>Average SAT</span><span>{college.avgSat ?? 'TBD'}</span></div>
              <div className="learn-item"><span>Graduation rate</span><span>{college.graduationRate != null ? `${college.graduationRate}%` : 'TBD'}</span></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
