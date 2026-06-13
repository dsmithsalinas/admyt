import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getCollege, getShortName } from '@/lib/colleges'
import type { College } from '@/lib/colleges'
import { useProfile } from '@/context/ProfileContext'
import { useAuth } from '@/context/AuthContext'
import AuthModal from '@/components/ui/AuthModal'
import { saveVibeCheck, getSavedVibe } from '@/lib/savedVibes'

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
}

const VIBE_DIMENSIONS = [
  { key: 'social', label: 'Social scene', emoji: '🎉', description: 'How active is the social life? Think parties, hangouts, events, and how easy it is to meet people outside the classroom.' },
  { key: 'athletics', label: 'Athletics & school spirit', emoji: '🏈', description: 'How much do sports and school pride define campus energy? Covers both big-time athletics and recreational/intramural culture.' },
  { key: 'arts', label: 'Arts, music & creativity', emoji: '🎨', description: 'Is there a strong creative community? Looks at music scenes, art programs, film culture, theater, and maker spaces.' },
  { key: 'political', label: 'Political & activist culture', emoji: '✊', description: 'How politically engaged is the campus? Covers activism, student organizing, protest culture, and civic involvement.' },
  { key: 'greekLife', label: 'Greek life', emoji: '🏛️', description: 'How central are fraternities and sororities to social life? High scores mean Greek life dominates the social scene.' },
  { key: 'diversity', label: 'Diversity & inclusion', emoji: '🌍', description: 'How diverse and welcoming is the campus community? Covers racial, cultural, socioeconomic, and identity-based diversity.' },
  { key: 'outdoor', label: 'Outdoor & nature access', emoji: '🏔️', description: 'How easy is it to get outside? Covers proximity to nature, hiking, outdoor recreation, and campus green space.' },
  { key: 'academic', label: 'Academic intensity', emoji: '📚', description: 'How competitive and rigorous is the academic culture day-to-day? High scores mean students study hard and academics dominate campus life.' },
  { key: 'community', label: 'Local community atmosphere', emoji: '🏘️', description: "What's the relationship between campus and the surrounding town or city? Covers off-campus life, local culture, and town-gown dynamics." },
]

function DimensionCard({ dim }: { dim: VibeDimension }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #EEECFB', borderRadius: '14px',
      padding: '14px 16px', boxShadow: '0 3px 16px rgba(99,102,241,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{dim.emoji}</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#15151C' }}>{dim.label}</span>
        </div>
        <span style={{ fontSize: '15px', fontWeight: 500, color: '#6366F1' }}>{dim.score}/10</span>
      </div>
      <div style={{ height: '6px', background: '#F4F3FE', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ height: '100%', width: `${dim.score * 10}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
      <p style={{ fontSize: '12px', color: '#8B8B9E', lineHeight: 1.6, margin: 0 }}>{dim.summary}</p>
    </div>
  )
}

function DimensionSelector({ selected, onToggle, onSelectAll }: { selected: Set<string>; onToggle: (key: string) => void; onSelectAll: () => void }) {
  const allSelected = selected.size === VIBE_DIMENSIONS.length
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', color: '#8B8B9E' }}>{selected.size} of {VIBE_DIMENSIONS.length} selected</div>
        <button onClick={onSelectAll} style={{ fontSize: '12px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {VIBE_DIMENSIONS.map(dim => {
          const isSelected = selected.has(dim.key)
          return (
            <div
              key={dim.key}
              onClick={() => onToggle(dim.key)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px',
                borderRadius: '14px',
                border: isSelected ? '1.5px solid #6366F1' : '1px solid #EEECFB',
                background: isSelected ? '#F4F3FE' : 'white',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: isSelected ? '0 2px 12px rgba(99,102,241,0.08)' : 'none',
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, marginTop: '1px',
                border: isSelected ? 'none' : '1.5px solid #D8D5F0',
                background: isSelected ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '15px' }}>{dim.emoji}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: isSelected ? '#4338CA' : '#15151C' }}>{dim.label}</span>
                </div>
                <div style={{ fontSize: '12px', color: isSelected ? '#6366F1' : '#8B8B9E', lineHeight: 1.6 }}>{dim.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function VibeCheck() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(VIBE_DIMENSIONS.map(d => d.key)))
  const [result, setResult] = useState<VibeResult | null>(null)
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    if (!user || !result || !college) return
    getSavedVibe(user.id, college.id).then(existing => { if (existing) setSaved(true) })
  }, [user, result, college])

  if (collegeLoading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#8B8B9E', fontSize: '14px' }}>Loading...</div>
  if (!college) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '14px', color: '#8B8B9E', marginBottom: '16px' }}>School not found.</div>
      <button onClick={() => navigate('/search')} style={{ fontSize: '13px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer' }}>Back to search</button>
    </div>
  )

  function toggleDimension(key: string) {
    setSelected(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })
  }

  function toggleSelectAll() {
    setSelected(selected.size === VIBE_DIMENSIONS.length ? new Set() : new Set(VIBE_DIMENSIONS.map(d => d.key)))
  }

  async function handleSave() {
    if (!user || !result || !college) return
    setSaveLoading(true); setSaveError(null)
    const err = await saveVibeCheck({ user_id: user.id, college_id: college.id, college_name: college.name, fit_score: result.fitScore, dimensions: result.dimensions, overall_summary: result.overallSummary })
    if (err) setSaveError(err); else setSaved(true)
    setSaveLoading(false)
  }

  async function runVibeCheck() {
    if (selected.size === 0) return
    setLoading(true); setError(null); setResult(null)
    const selectedDims = VIBE_DIMENSIONS.filter(d => selected.has(d.key))
    const systemPrompt = `You are Admyt's Vibe Check feature. Analyze the social scene, campus culture, and student life at a college for a specific set of dimensions chosen by the student.\n\nYou must respond with ONLY valid JSON — no preamble, no explanation, no markdown. The JSON must match this exact structure:\n{\n  "dimensions": [\n    { "key": "social", "label": "Social scene", "emoji": "🎉", "score": 7, "summary": "One honest sentence about this dimension at this specific school." }\n  ],\n  "overallSummary": "2-3 sentence honest summary of the overall vibe and whether it fits this student.",\n  "fitScore": 75\n}\n\nOnly include the dimensions the student selected. Scores are 1-10. fitScore is 1-100. Be honest, specific, and avoid generic talking points. Base your analysis on real knowledge of the school.`
    if (!college) return
    const userMessage = `College: ${college.name} in ${college.location}\nStudent interests: ${profile?.careerGoals?.join(', ') || 'not specified'}\nStudent location preference: ${profile?.preferredLocations?.join(', ') || 'not specified'}\nIntended major: ${profile?.intendedMajor || 'not specified'}\n\nDimensions to analyze:\n${selectedDims.map(d => `- ${d.key}: ${d.label} — ${d.description}`).join('\n')}\n\nPlease generate a vibe check for only these dimensions.`
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ system: systemPrompt, messages: [{ role: 'user', content: userMessage }] }),
      })
      const data = await resp.json()
      const text = data.content?.[0]?.text ?? ''
      const parsed: VibeResult = JSON.parse(text.replace(/```json|```/g, '').trim())
      setResult(parsed)
    } catch (err) {
      setError("Hmm, something didn't work — mind trying again?")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fitColor = result ? (result.fitScore >= 80 ? '#6366F1' : result.fitScore >= 60 ? '#8B5CF6' : '#A8A8BC') : '#6366F1'
  const schoolFirst = getShortName(college.name)

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 0' }}>

      {/* Back */}
      <button
        onClick={() => navigate(`/college/${id}`)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8B8B9E', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '1.5rem' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to {schoolFirst}
      </button>

      {/* Gradient hero */}
      <div style={{
        background: 'linear-gradient(150deg, #6366F1, #8B5CF6 60%, #EC4899)',
        borderRadius: '22px', padding: '22px 20px', marginBottom: '2rem',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
          padding: '4px 12px', fontSize: '12px', fontWeight: 500, color: 'white',
          marginBottom: '12px',
        }}>
          ✨ Vibe Check
        </div>
        <h1 style={{ fontSize: '21px', fontWeight: 500, color: 'white', letterSpacing: '-0.3px', marginBottom: '6px' }}>
          Would you actually fit at {schoolFirst}?
        </h1>
        <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.55 }}>
          Not the brochure version — the real one. Pick what matters to you and I'll give it to you straight.
        </p>
      </div>

      {/* Selector */}
      {!result && !loading && (
        <>
          <DimensionSelector selected={selected} onToggle={toggleDimension} onSelectAll={toggleSelectAll} />
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#DC2626', marginTop: '16px' }}>
              {error}
            </div>
          )}
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={runVibeCheck}
              disabled={selected.size === 0}
              style={{
                width: '100%',
                background: selected.size === 0 ? '#F4F3FE' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: selected.size === 0 ? '#A8A8BC' : 'white',
                border: 'none', borderRadius: '16px', padding: '13px',
                fontSize: '14px', fontWeight: 500,
                cursor: selected.size === 0 ? 'default' : 'pointer',
                boxShadow: selected.size === 0 ? 'none' : '0 6px 20px rgba(99,102,241,0.25)',
                transition: 'all 0.15s',
              }}
            >
              {selected.size === 0 ? 'Pick at least one dimension first' : `Run my Vibe Check — ${selected.size} dimension${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          background: 'linear-gradient(150deg, #1E1B3A, #2D1B4E)',
          borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center', marginTop: '1rem',
        }}>
          <div style={{ fontSize: '13px', color: '#8B8B9E', marginBottom: '16px' }}>
            Looking into {schoolFirst}'s real deal across {selected.size} dimensions...
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1', animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Fit score hero */}
          <div style={{
            background: 'linear-gradient(150deg, #1E1B3A, #2D1B4E)',
            borderRadius: '16px', padding: '24px', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6366F1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                Your fit score
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, maxWidth: '380px' }}>
                {result.overallSummary}
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '48px', fontWeight: 500, color: fitColor, lineHeight: 1 }}>{result.fitScore}</div>
              <div style={{ fontSize: '11px', color: '#6366F1', marginTop: '4px' }}>/ 100</div>
            </div>
          </div>

          {/* Dimension results */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
            {result.dimensions.map(dim => <DimensionCard key={dim.key} dim={dim} />)}
          </div>

          {/* Save bar — signed in */}
          {user && (
            <div style={{
              marginTop: '16px',
              background: saved ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : 'linear-gradient(135deg, #F4F3FE, #FCE7F3)',
              border: `1px solid ${saved ? '#A7F3D0' : '#EEECFB'}`,
              borderRadius: '14px', padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: saved ? '#065F46' : '#15151C', marginBottom: '2px' }}>
                  {saved ? '✓ Saved to your profile' : 'Save this Vibe Check'}
                </div>
                <div style={{ fontSize: '12px', color: saved ? '#059669' : '#8B8B9E' }}>
                  {saved ? 'Find it anytime in your profile.' : 'Come back to it whenever — it\'ll be in your profile.'}
                </div>
              </div>
              {!saved && (
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white',
                    border: 'none', borderRadius: '10px', padding: '8px 16px',
                    fontSize: '13px', fontWeight: 500, cursor: saveLoading ? 'default' : 'pointer',
                    opacity: saveLoading ? 0.7 : 1, whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                  }}
                >
                  {saveLoading ? 'Saving...' : 'Save results'}
                </button>
              )}
            </div>
          )}

          {saveError && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '8px 12px' }}>
              {saveError} — make sure the saved_vibes table exists in Supabase.
            </div>
          )}

          {/* Guest save prompt */}
          {!user && (
            <div style={{
              marginTop: '16px', background: 'linear-gradient(135deg, #F4F3FE, #FCE7F3)',
              border: '1px solid #EEECFB', borderRadius: '14px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#4338CA', marginBottom: '3px' }}>Don't lose this</div>
                <div style={{ fontSize: '12px', color: '#6366F1' }}>Free account. Save this result and keep building your list.</div>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white',
                  border: 'none', borderRadius: '10px', padding: '8px 16px',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Save results
              </button>
            </div>
          )}

          {/* Re-run / adjust */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={() => { setResult(null); setError(null); setSaved(false) }}
              style={{ flex: 1, fontSize: '13px', color: '#8B8B9E', background: 'white', border: '1px solid #EEECFB', borderRadius: '10px', padding: '10px', cursor: 'pointer' }}
            >
              Change what I'm checking
            </button>
            <button
              onClick={runVibeCheck}
              style={{ flex: 1, fontSize: '13px', color: '#6366F1', background: '#F4F3FE', border: '1px solid #EEECFB', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontWeight: 500 }}
            >
              Run it again
            </button>
          </div>
        </>
      )}

      {showAuthModal && (
        <AuthModal trigger="vibecheck" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
      )}

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-5px);opacity:1} }`}</style>
    </div>
  )
}
