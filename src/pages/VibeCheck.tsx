import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { sampleColleges } from '@/data/sampleColleges'
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
  {
    key: 'social',
    label: 'Social scene',
    emoji: '🎉',
    description: 'How active is the social life? Think parties, hangouts, events, and how easy it is to meet people outside the classroom.',
  },
  {
    key: 'athletics',
    label: 'Athletics & school spirit',
    emoji: '🏈',
    description: 'How much do sports and school pride define campus energy? Covers both big-time athletics and recreational/intramural culture.',
  },
  {
    key: 'arts',
    label: 'Arts, music & creativity',
    emoji: '🎨',
    description: 'Is there a strong creative community? Looks at music scenes, art programs, film culture, theater, and maker spaces.',
  },
  {
    key: 'political',
    label: 'Political & activist culture',
    emoji: '✊',
    description: 'How politically engaged is the campus? Covers activism, student organizing, protest culture, and civic involvement.',
  },
  {
    key: 'greekLife',
    label: 'Greek life',
    emoji: '🏛️',
    description: 'How central are fraternities and sororities to social life? High scores mean Greek life dominates the social scene.',
  },
  {
    key: 'diversity',
    label: 'Diversity & inclusion',
    emoji: '🌍',
    description: 'How diverse and welcoming is the campus community? Covers racial, cultural, socioeconomic, and identity-based diversity.',
  },
  {
    key: 'outdoor',
    label: 'Outdoor & nature access',
    emoji: '🏔️',
    description: 'How easy is it to get outside? Covers proximity to nature, hiking, outdoor recreation, and campus green space.',
  },
  {
    key: 'academic',
    label: 'Academic intensity',
    emoji: '📚',
    description: 'How competitive and rigorous is the academic culture day-to-day? High scores mean students study hard and academics dominate campus life.',
  },
  {
    key: 'community',
    label: 'Local community atmosphere',
    emoji: '🏘️',
    description: 'What\'s the relationship between campus and the surrounding town or city? Covers off-campus life, local culture, and town-gown dynamics.',
  },
]

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{
      height: '6px',
      background: 'var(--color-background-secondary)',
      borderRadius: '3px',
      overflow: 'hidden',
      marginTop: '6px',
    }}>
      <div style={{
        height: '100%',
        width: `${score * 10}%`,
        background: color,
        borderRadius: '3px',
        transition: 'width 0.6s ease',
      }} />
    </div>
  )
}

function DimensionCard({ dim, color }: { dim: VibeDimension; color: string }) {
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: '12px',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{dim.emoji}</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {dim.label}
          </span>
        </div>
        <span style={{ fontSize: '15px', fontWeight: 500, color }}>{dim.score}/10</span>
      </div>
      <ScoreBar score={dim.score} color={color} />
      <p style={{
        fontSize: '12px', color: 'var(--color-text-secondary)',
        lineHeight: 1.6, margin: '8px 0 0',
      }}>
        {dim.summary}
      </p>
    </div>
  )
}

function DimensionSelector({
  selected,
  onToggle,
  onSelectAll,
}: {
  selected: Set<string>
  onToggle: (key: string) => void
  onSelectAll: () => void
}) {
  const allSelected = selected.size === VIBE_DIMENSIONS.length

  return (
    <div>
      {/* Select all */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
      }}>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {selected.size} of {VIBE_DIMENSIONS.length} selected
        </div>
        <button
          onClick={onSelectAll}
          style={{
            fontSize: '12px', color: '#6366F1',
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, fontWeight: 500,
          }}
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Dimension cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {VIBE_DIMENSIONS.map(dim => {
          const isSelected = selected.has(dim.key)
          return (
            <div
              key={dim.key}
              onClick={() => onToggle(dim.key)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                border: isSelected
                  ? '1.5px solid #6366F1'
                  : '0.5px solid var(--color-border-tertiary)',
                background: isSelected ? '#EEF2FF' : 'var(--color-background-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: '18px', height: '18px',
                borderRadius: '5px',
                border: isSelected ? 'none' : '1.5px solid var(--color-border-secondary)',
                background: isSelected ? '#6366F1' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: '1px',
              }}>
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '15px' }}>{dim.emoji}</span>
                  <span style={{
                    fontSize: '13px', fontWeight: 500,
                    color: isSelected ? '#3730A3' : 'var(--color-text-primary)',
                  }}>
                    {dim.label}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: isSelected ? '#4338CA' : 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                }}>
                  {dim.description}
                </div>
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
  const [selected, setSelected] = useState<Set<string>>(
    new Set(VIBE_DIMENSIONS.map(d => d.key))
  )
  const [result, setResult] = useState<VibeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const college = sampleColleges.find(c => c.id === id)

  useEffect(() => {
    if (!user || !result || !college) return
    getSavedVibe(user.id, college.id).then(existing => {
      if (existing) setSaved(true)
    })
  }, [user, result, college])

  if (!college) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          School not found.
        </div>
        <button onClick={() => navigate('/search')} style={{
          fontSize: '13px', color: '#6366F1',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          Back to search
        </button>
      </div>
    )
  }

  function toggleDimension(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === VIBE_DIMENSIONS.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(VIBE_DIMENSIONS.map(d => d.key)))
    }
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

    if (err) {
      setSaveError(err)
    } else {
      setSaved(true)
    }
    setSaveLoading(false)
  }

  async function runVibeCheck() {
    if (selected.size === 0) return
    setLoading(true)
    setError(null)
    setResult(null)

    const selectedDims = VIBE_DIMENSIONS.filter(d => selected.has(d.key))

    const systemPrompt = `You are Admyt's Vibe Check feature. Analyze the social scene, campus culture, and student life at a college for a specific set of dimensions chosen by the student.

You must respond with ONLY valid JSON — no preamble, no explanation, no markdown. The JSON must match this exact structure:
{
  "dimensions": [
    { "key": "social", "label": "Social scene", "emoji": "🎉", "score": 7, "summary": "One honest sentence about this dimension at this specific school." }
  ],
  "overallSummary": "2-3 sentence honest summary of the overall vibe and whether it fits this student.",
  "fitScore": 75
}

Only include the dimensions the student selected. Scores are 1-10. fitScore is 1-100. Be honest, specific, and avoid generic talking points. Base your analysis on real knowledge of the school.`

    const userMessage = `College: ${college.name} in ${college.location}
Student interests: ${profile?.careerGoals?.join(', ') || 'not specified'}
Student location preference: ${profile?.preferredLocations?.join(', ') || 'not specified'}
Intended major: ${profile?.intendedMajor || 'not specified'}

Dimensions to analyze:
${selectedDims.map(d => `- ${d.key}: ${d.label} — ${d.description}`).join('\n')}

Please generate a vibe check for only these dimensions.`

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      const data = await response.json()
      const text = data.content?.[0]?.text ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed: VibeResult = JSON.parse(clean)
      setResult(parsed)
    } catch (err) {
      setError('Something went wrong generating the vibe check. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const accentColor = '#6366F1'
  const fitColor = result
    ? result.fitScore >= 80 ? '#059669'
    : result.fitScore >= 60 ? '#6366F1'
    : '#94A3B8'
    : accentColor

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 0' }}>

      {/* Back button */}
      <button
        onClick={() => navigate(`/college/${id}`)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: 'var(--color-text-secondary)',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, marginBottom: '1.5rem',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to {college.name.split(' ')[0]}
      </button>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#EEF2FF', border: '0.5px solid #C7D2FE',
          borderRadius: '20px', padding: '3px 10px',
          fontSize: '12px', fontWeight: 500, color: '#4338CA',
          marginBottom: '10px',
        }}>
          ✨ Vibe Check
        </div>
        <h1 style={{
          fontSize: '24px', fontWeight: 500,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.3px', marginBottom: '4px',
        }}>
          {college.name}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Choose the dimensions that matter to you, then run your analysis.
        </p>
      </div>

      {/* Selector — hide once results are showing */}
      {!result && !loading && (
        <>
          <DimensionSelector
            selected={selected}
            onToggle={toggleDimension}
            onSelectAll={toggleSelectAll}
          />

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '0.5px solid #FECACA',
              borderRadius: '10px', padding: '12px 16px',
              fontSize: '13px', color: '#DC2626',
              marginTop: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Run button */}
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={runVibeCheck}
              disabled={selected.size === 0}
              style={{
                width: '100%',
                background: selected.size === 0 ? 'var(--color-background-secondary)' : '#6366F1',
                color: selected.size === 0 ? 'var(--color-text-tertiary)' : 'white',
                border: 'none', borderRadius: '10px',
                padding: '13px', fontSize: '14px',
                fontWeight: 500,
                cursor: selected.size === 0 ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {selected.size === 0
                ? 'Select at least one dimension'
                : `Run Vibe Check — ${selected.size} dimension${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          background: '#0F172A',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          marginTop: '1rem',
        }}>
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
            Analyzing {college.name}'s vibe across {selected.size} dimensions...
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#6366F1',
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Fit score hero */}
          <div style={{
            background: '#0F172A',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              <div style={{
                fontSize: '12px', color: '#64748B',
                marginBottom: '6px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Overall vibe fit
              </div>
              <div style={{
                fontSize: '13px', color: '#94A3B8',
                lineHeight: 1.6, maxWidth: '380px',
              }}>
                {result.overallSummary}
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '48px', fontWeight: 500, color: fitColor, lineHeight: 1 }}>
                {result.fitScore}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>/ 100</div>
            </div>
          </div>

          {/* Dimension results */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '10px',
            marginBottom: '1.5rem',
          }}>
            {result.dimensions.map(dim => (
              <DimensionCard key={dim.key} dim={dim} color={accentColor} />
            ))}
          </div>

          {/* Save bar — signed in */}
          {user && (
            <div style={{
              marginTop: '16px',
              background: saved ? '#ECFDF5' : 'var(--color-background-secondary)',
              border: `0.5px solid ${saved ? '#A7F3D0' : 'var(--color-border-tertiary)'}`,
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'all 0.3s',
            }}>
              <div>
                <div style={{
                  fontSize: '13px', fontWeight: 500,
                  color: saved ? '#065F46' : 'var(--color-text-primary)',
                  marginBottom: '2px',
                }}>
                  {saved ? '✓ Vibe Check saved' : 'Save this Vibe Check'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: saved ? '#059669' : 'var(--color-text-secondary)',
                }}>
                  {saved
                    ? 'You can find this in your saved results.'
                    : 'Save to your profile to revisit later.'}
                </div>
              </div>
              {!saved && (
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  style={{
                    background: '#6366F1', color: 'white',
                    border: 'none', borderRadius: '8px',
                    padding: '8px 16px', fontSize: '13px',
                    fontWeight: 500, cursor: saveLoading ? 'default' : 'pointer',
                    opacity: saveLoading ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {saveLoading ? 'Saving...' : 'Save results'}
                </button>
              )}
            </div>
          )}

          {/* Save error */}
          {saveError && (
            <div style={{
              marginTop: '8px',
              fontSize: '12px', color: '#DC2626',
              background: '#FEF2F2', border: '0.5px solid #FECACA',
              borderRadius: '6px', padding: '8px 12px',
            }}>
              {saveError} — make sure the saved_vibes table exists in Supabase.
            </div>
          )}

          {/* Save prompt — guest */}
          {!user && (
            <div style={{
              marginTop: '16px',
              background: '#EEF2FF',
              border: '0.5px solid #C7D2FE',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#3730A3', marginBottom: '3px' }}>
                  Save your Vibe Check
                </div>
                <div style={{ fontSize: '12px', color: '#4338CA' }}>
                  Create a free account to save these results and your college list.
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  background: '#6366F1', color: 'white',
                  border: 'none', borderRadius: '8px',
                  padding: '8px 16px', fontSize: '13px',
                  fontWeight: 500, cursor: 'pointer',
                  whiteSpace: 'nowrap',
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
              style={{
                flex: 1, fontSize: '13px',
                color: 'var(--color-text-secondary)',
                background: 'none',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '8px',
                padding: '10px', cursor: 'pointer',
              }}
            >
              Adjust dimensions
            </button>
            <button
              onClick={runVibeCheck}
              style={{
                flex: 1, fontSize: '13px',
                color: '#6366F1',
                background: '#EEF2FF',
                border: '0.5px solid #C7D2FE',
                borderRadius: '8px',
                padding: '10px', cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Re-run analysis
            </button>
          </div>
        </>
      )}

      {showAuthModal && (
        <AuthModal
          trigger="vibecheck"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
