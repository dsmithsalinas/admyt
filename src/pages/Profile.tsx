import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { supabase } from '@/lib/supabase'
import AuthModal from '@/components/ui/AuthModal'

interface SavedVibe {
  id: string
  college_id: string
  college_name: string
  fit_score: number
  overall_summary: string
  created_at: string
}

interface HeartedSchool {
  id: string
  college_id: string
  college_name: string
  created_at: string
}

interface UserPreferences {
  preferred_states: string[]
  max_tuition: number | null
  preferred_majors: string[]
}

const US_STATES = [
  { abbr: 'AK', name: 'Alaska' }, { abbr: 'AL', name: 'Alabama' },
  { abbr: 'AR', name: 'Arkansas' }, { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DC', name: 'Washington D.C.' },
  { abbr: 'DE', name: 'Delaware' }, { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'IA', name: 'Iowa' }, { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' },
  { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' }, { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MD', name: 'Maryland' }, { abbr: 'ME', name: 'Maine' },
  { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MT', name: 'Montana' }, { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' }, { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NY', name: 'New York' }, { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' }, { abbr: 'OR', name: 'Oregon' },
  { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' }, { abbr: 'TX', name: 'Texas' },
  { abbr: 'UT', name: 'Utah' }, { abbr: 'VA', name: 'Virginia' },
  { abbr: 'VT', name: 'Vermont' }, { abbr: 'WA', name: 'Washington' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WY', name: 'Wyoming' },
]

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>{title}</h2>
      {action}
    </div>
  )
}

function EmptyState({ emoji, message, action }: { emoji: string; message: string; action?: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: '12px', padding: '24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{emoji}</div>
      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: action ? '12px' : 0 }}>{message}</div>
      {action}
    </div>
  )
}

function Skeleton({ height = 80 }: { height?: number }) {
  return (
    <div style={{
      height, borderRadius: '12px',
      background: 'var(--color-background-secondary)',
      animation: 'profilePulse 1.5s ease-in-out infinite',
    }} />
  )
}

function CompletenessBar({ score, nudge }: { score: number; nudge: string }) {
  const color = score >= 80 ? '#059669' : score >= 50 ? '#6366F1' : '#EF9F27'
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: '12px', padding: '14px 16px', marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Profile completeness</div>
        <div style={{ fontSize: '13px', fontWeight: 500, color }}>{score}%</div>
      </div>
      <div style={{ height: '6px', background: 'var(--color-border-tertiary)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
      {score < 100 && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>💡 {nudge}</div>
      )}
    </div>
  )
}

function GuestPreview({ onSignUp }: { onSignUp: () => void }) {
  const exampleHearts = ['University of California, Berkeley', 'Northeastern University', 'University of Michigan']
  const exampleVibes = [
    { name: 'UC Berkeley', score: 82, summary: 'Strong academic intensity with a vibrant activist culture.' },
    { name: 'Northeastern', score: 58, summary: 'Career-driven, decentralized social scene — great for self-starters.' },
  ]

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: '#E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', marginBottom: '12px',
        }}>
          👋
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px', letterSpacing: '-0.3px' }}>
          Alex Chen's profile
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Class of 2026 · Example profile</div>
      </div>

      <div style={{
        background: '#0F172A', borderRadius: '16px', padding: '20px 24px',
        marginBottom: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#FFFFFF', marginBottom: '4px' }}>
            Create your own profile
          </div>
          <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            Save your schools, track vibe checks, and let Sage remember everything about you.
          </div>
        </div>
        <button
          onClick={onSignUp}
          style={{
            background: '#6366F1', color: 'white', border: 'none',
            borderRadius: '8px', padding: '10px 18px', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Sign up free
        </button>
      </div>

      <CompletenessBar score={72} nudge="Tell Sage your GPA to improve match scores." />

      {/* Example Sage profile */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader title="What Sage knows" />
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: '12px', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '10px',
          opacity: 0.6, pointerEvents: 'none',
        }}>
          {[
            { label: 'Location', value: 'California, Pacific Northwest' },
            { label: 'Intended major', value: 'Computer Science' },
            { label: 'Career goals', value: 'Software engineering, startups' },
            { label: 'School size', value: 'Large universities preferred' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', width: '100px', flexShrink: 0, paddingTop: '1px' }}>{item.label}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Example schools */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader title="My schools" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.6, pointerEvents: 'none' }}>
          {exampleHearts.map(name => (
            <div key={name} style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: '12px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{name}</div>
              <span style={{ color: '#F0ABFC', fontSize: '18px' }}>♥</span>
            </div>
          ))}
        </div>
      </div>

      {/* Example vibes */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader title="Vibe Checks" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.6, pointerEvents: 'none' }}>
          {exampleVibes.map(v => (
            <div key={v.name} style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: '12px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '3px' }}>{v.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{v.summary}</div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: '#6366F1', flexShrink: 0 }}>{v.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreferencesModal({
  prefs, onSave, onClose,
}: {
  prefs: UserPreferences
  onSave: (p: UserPreferences) => void
  onClose: () => void
}) {
  const [states, setStates] = useState<string[]>(prefs.preferred_states)
  const [maxTuition, setMaxTuition] = useState(prefs.max_tuition ?? 70000)
  const [major, setMajor] = useState(prefs.preferred_majors[0] ?? '')

  function toggleState(abbr: string) {
    setStates(prev => prev.includes(abbr) ? prev.filter(s => s !== abbr) : [...prev, abbr])
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-background-primary)',
          borderRadius: '16px', padding: '24px',
          width: '100%', maxWidth: '480px',
          maxHeight: '80vh', overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '18px', color: 'var(--color-text-tertiary)',
        }}>✕</button>

        <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '20px', letterSpacing: '-0.3px' }}>
          My preferences
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Preferred states
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {US_STATES.map(s => (
              <button
                key={s.abbr}
                onClick={() => toggleState(s.abbr)}
                style={{
                  fontSize: '12px', padding: '4px 10px',
                  borderRadius: '20px', cursor: 'pointer',
                  border: states.includes(s.abbr) ? 'none' : '0.5px solid var(--color-border-secondary)',
                  background: states.includes(s.abbr) ? '#6366F1' : 'transparent',
                  color: states.includes(s.abbr) ? 'white' : 'var(--color-text-secondary)',
                  fontWeight: states.includes(s.abbr) ? 500 : 400,
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Max tuition — ${maxTuition.toLocaleString()}/yr
          </div>
          <input
            type="range" min={5000} max={75000} step={1000}
            value={maxTuition} onChange={e => setMaxTuition(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#6366F1' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            <span>$5k</span><span>$75k</span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Intended major
          </div>
          <input
            type="text" value={major} onChange={e => setMajor(e.target.value)}
            placeholder="e.g. Computer Science"
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: '8px', fontSize: '14px',
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={() => onSave({
            preferred_states: states,
            max_tuition: maxTuition,
            preferred_majors: major ? [major] : [],
          })}
          style={{
            width: '100%', padding: '11px', borderRadius: '8px',
            fontSize: '14px', background: '#6366F1', color: 'white',
            border: 'none', cursor: 'pointer', fontWeight: 500,
          }}
        >
          Save preferences
        </button>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const { profile: sageProfile } = useProfile()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPrefsModal, setShowPrefsModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hearts, setHearts] = useState<HeartedSchool[]>([])
  const [vibes, setVibes] = useState<SavedVibe[]>([])
  const [prefs, setPrefs] = useState<UserPreferences>({
    preferred_states: [], max_tuition: null, preferred_majors: [],
  })

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      supabase.from('hearted_schools').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('saved_vibes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    ]).then(([heartsRes, vibesRes, prefsRes]) => {
      setHearts(heartsRes.data ?? [])
      setVibes(vibesRes.data ?? [])
      if (prefsRes.data) setPrefs(prefsRes.data)
      setLoading(false)
    })
  }, [user])

  async function handleUnheart(collegeId: string) {
    if (!user) return
    await supabase.from('hearted_schools').delete().eq('user_id', user.id).eq('college_id', collegeId)
    setHearts(prev => prev.filter(h => h.college_id !== collegeId))
  }

  async function handleSavePrefs(newPrefs: UserPreferences) {
    if (!user) return
    await supabase.from('user_preferences').upsert({ user_id: user.id, ...newPrefs }, { onConflict: 'user_id' })
    setPrefs(newPrefs)
    setShowPrefsModal(false)
  }

  function getCompleteness() {
    let score = 0
    if (sageProfile?.intendedMajor) score += 20
    if (sageProfile?.careerGoals?.length) score += 20
    if (sageProfile?.preferredLocations?.length) score += 20
    if (hearts.length > 0) score += 20
    if (vibes.length > 0) score += 20
    return score
  }

  function getCompletenessNudge() {
    if (!sageProfile?.intendedMajor) return 'Tell Sage your intended major to improve match scores.'
    if (!sageProfile?.careerGoals?.length) return 'Share your career goals with Sage for better recommendations.'
    if (!sageProfile?.preferredLocations?.length) return 'Tell Sage where you want to study.'
    if (!hearts.length) return 'Heart a school to start building your list.'
    if (!vibes.length) return "Run a Vibe Check on a school you're interested in."
    return 'Your profile is complete!'
  }

  if (!user) {
    return (
      <>
        <GuestPreview onSignUp={() => setShowAuthModal(true)} />
        {showAuthModal && (
          <AuthModal trigger="general" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
        )}
      </>
    )
  }

  const completeness = getCompleteness()
  const initials = user.email?.charAt(0).toUpperCase() ?? '?'

  const linkStyle = {
    display: 'inline-block', fontSize: '13px', color: '#6366F1',
    background: '#EEF2FF', border: '0.5px solid #C7D2FE',
    borderRadius: '8px', padding: '7px 14px',
    textDecoration: 'none', fontWeight: 500,
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '2rem' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#6366F1', border: '2px solid #818CF8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: 500, color: 'white', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px', letterSpacing: '-0.3px' }}>
            {user.email?.split('@')[0]}'s profile
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{user.email}</div>
        </div>
      </div>

      {!loading && <CompletenessBar score={completeness} nudge={getCompletenessNudge()} />}

      {/* What Sage knows */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader
          title="What Sage knows"
          action={<a href="/" style={{ fontSize: '12px', color: '#6366F1', textDecoration: 'none' }}>Chat with Sage →</a>}
        />
        {loading ? (
          <Skeleton height={120} />
        ) : !sageProfile || (!sageProfile.intendedMajor && !sageProfile.careerGoals?.length && !sageProfile.preferredLocations?.length) ? (
          <EmptyState
            emoji="🤔"
            message="Sage hasn't learned much about you yet. Start a conversation to build your profile."
            action={<a href="/" style={linkStyle}>Chat with Sage</a>}
          />
        ) : (
          <div style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: '12px', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {[
              { label: 'Location', value: sageProfile.preferredLocations?.join(', ') },
              { label: 'Intended major', value: sageProfile.intendedMajor },
              { label: 'Career goals', value: sageProfile.careerGoals?.join(', ') },
            ].filter(item => item.value).map(item => (
              <div key={item.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  width: '90px', flexShrink: 0, paddingTop: '2px',
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My schools */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader
          title="My schools"
          action={<span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{hearts.length} saved</span>}
        />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height={60} /><Skeleton height={60} /><Skeleton height={60} />
          </div>
        ) : hearts.length === 0 ? (
          <EmptyState
            emoji="🏫"
            message="No saved schools yet. Heart a school in Sage or Browse to save it here."
            action={<a href="/search" style={linkStyle}>Browse schools</a>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hearts.map(h => (
              <div key={h.id} style={{
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: '12px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#F0ABFC', fontSize: '16px' }}>♥</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {h.college_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                      Saved {new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <a href={`/college/${h.college_id}`} style={{ fontSize: '12px', color: '#6366F1', textDecoration: 'none' }}>
                    View →
                  </a>
                  <button
                    onClick={() => handleUnheart(h.college_id)}
                    style={{
                      fontSize: '12px', color: 'var(--color-text-tertiary)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px 8px', borderRadius: '6px',
                    }}
                    title="Remove from saved"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vibe checks */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader
          title="Vibe Checks"
          action={<span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{vibes.length} saved</span>}
        />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height={80} /><Skeleton height={80} />
          </div>
        ) : vibes.length === 0 ? (
          <EmptyState
            emoji="✨"
            message="No saved Vibe Checks yet. Run one on a school you're curious about."
            action={<a href="/search" style={linkStyle}>Find a school</a>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {vibes.map(v => {
              const fitColor = v.fit_score >= 80 ? '#059669' : v.fit_score >= 60 ? '#6366F1' : '#94A3B8'
              return (
                <div key={v.id} style={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: '12px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {v.college_name}
                      </span>
                      <span style={{
                        fontSize: '11px', padding: '1px 7px', borderRadius: '20px',
                        background: '#EEF2FF', color: '#4338CA', fontWeight: 500,
                      }}>
                        ✨ Vibe Check
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {v.overall_summary}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                      {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '24px', fontWeight: 500, color: fitColor }}>{v.fit_score}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>fit</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader
          title="My preferences"
          action={
            <button
              onClick={() => setShowPrefsModal(true)}
              style={{ fontSize: '12px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Edit
            </button>
          }
        />
        {loading ? (
          <Skeleton height={100} />
        ) : prefs.preferred_states.length === 0 && !prefs.max_tuition && prefs.preferred_majors.length === 0 ? (
          <EmptyState
            emoji="⚙️"
            message="Set standing preferences to help Sage and the search page work better for you."
            action={
              <button
                onClick={() => setShowPrefsModal(true)}
                style={{
                  fontSize: '13px', color: '#6366F1',
                  background: '#EEF2FF', border: '0.5px solid #C7D2FE',
                  borderRadius: '8px', padding: '7px 14px',
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                Set preferences
              </button>
            }
          />
        ) : (
          <div style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: '12px', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {prefs.preferred_states.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px', flexShrink: 0, paddingTop: '2px' }}>States</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {prefs.preferred_states.map(s => (
                    <span key={s} style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '20px', background: '#EEF2FF', color: '#4338CA', border: '0.5px solid #C7D2FE' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {prefs.max_tuition != null && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px', flexShrink: 0 }}>Max tuition</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>${prefs.max_tuition.toLocaleString()}/yr</div>
              </div>
            )}
            {prefs.preferred_majors.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px', flexShrink: 0 }}>Major</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{prefs.preferred_majors.join(', ')}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {showPrefsModal && (
        <PreferencesModal prefs={prefs} onSave={handleSavePrefs} onClose={() => setShowPrefsModal(false)} />
      )}

      <style>{`@keyframes profilePulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}
