import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { supabase } from '@/lib/supabase'
import AuthModal from '@/components/ui/AuthModal'
import { Input, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/shadcn'

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
      <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#15151C', margin: 0 }}>{title}</h2>
      {action}
    </div>
  )
}

function EmptyState({ emoji, message, action }: { emoji: string; message: string; action?: React.ReactNode }) {
  return (
    <div style={{ background: '#F4F3FE', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{emoji}</div>
      <div style={{ fontSize: '13px', color: '#8B8B9E', marginBottom: action ? '12px' : 0 }}>{message}</div>
      {action}
    </div>
  )
}

function Skeleton({ height = 80 }: { height?: number }) {
  return (
    <div style={{ height, borderRadius: '12px', background: '#F4F3FE', animation: 'profilePulse 1.5s ease-in-out infinite' }} />
  )
}

function CompletenessBar({ score, nudge }: { score: number; nudge: string }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #F4F3FE, #FCE7F3)',
      border: '1px solid #EEECFB',
      borderRadius: '14px', padding: '14px 18px', marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#4338CA' }}>Profile completeness</div>
        <div style={{
          fontSize: '13px', fontWeight: 500,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>{score}%</div>
      </div>
      <div style={{ height: '6px', background: '#DDD9F8', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ height: '100%', width: `${score}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
      {score < 100 && (
        <div style={{ fontSize: '12px', color: '#6366F1' }}>💡 {nudge}</div>
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
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', marginBottom: '12px',
          boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
        }}>
          👋
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#15151C', marginBottom: '4px', letterSpacing: '-0.3px' }}>
          Alex Chen's profile
        </h1>
        <div style={{ fontSize: '13px', color: '#8B8B9E' }}>Class of 2026 · Example profile</div>
      </div>

      <div style={{
        background: 'linear-gradient(150deg, #6366F1, #8B5CF6 60%, #EC4899)',
        borderRadius: '16px', padding: '20px 24px',
        marginBottom: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#FFFFFF', marginBottom: '4px' }}>
            This could be your profile
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
            Free account. Save your schools, your Vibe Checks, and let Sage remember everything.
          </div>
        </div>
        <button
          onClick={onSignUp}
          style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            border: '1.5px solid rgba(255,255,255,0.4)',
            borderRadius: '10px', padding: '9px 18px',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0, backdropFilter: 'blur(4px)',
          }}
        >
          Sign up free
        </button>
      </div>

      <CompletenessBar score={72} nudge="Tell Sage your GPA to improve match scores." />

      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader title="What Sage knows" />
        <div style={{
          background: 'white', border: '1px solid #EEECFB', borderRadius: '14px', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.6, pointerEvents: 'none',
        }}>
          {[
            { label: 'Location', value: 'California, Pacific Northwest' },
            { label: 'Intended major', value: 'Computer Science' },
            { label: 'Career goals', value: 'Software engineering, startups' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '11px', color: '#A8A8BC', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px', flexShrink: 0, paddingTop: '2px' }}>{item.label}</div>
              <div style={{ fontSize: '13px', color: '#3A3A4D' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader title="My schools" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.6, pointerEvents: 'none' }}>
          {exampleHearts.map(name => (
            <div key={name} style={{
              background: 'white', border: '1px solid #EEECFB', borderRadius: '12px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg, #FCE7F3, #FBCFE8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', color: '#EC4899',
              }}>♥</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#15151C' }}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader title="Vibe Checks" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.6, pointerEvents: 'none' }}>
          {exampleVibes.map(v => (
            <div key={v.name} style={{
              background: 'white', border: '1px solid #EEECFB', borderRadius: '14px', overflow: 'hidden',
              display: 'flex', alignItems: 'stretch',
            }}>
              <div style={{ width: '3px', flexShrink: 0, background: 'linear-gradient(180deg, #6366F1, #EC4899)' }} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#15151C', marginBottom: '3px' }}>{v.name}</div>
                  <div style={{ fontSize: '12px', color: '#8B8B9E' }}>{v.summary}</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: '#6366F1', flexShrink: 0 }}>{v.score}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreferencesModal({ prefs, onSave, onClose }: { prefs: UserPreferences; onSave: (p: UserPreferences) => void; onClose: () => void }) {
  const [states, setStates] = useState<string[]>(prefs.preferred_states)
  const [maxTuition, setMaxTuition] = useState(prefs.max_tuition ?? 70000)
  const [major, setMajor] = useState(prefs.preferred_majors[0] ?? '')
  const [stateSearch, setStateSearch] = useState('')

  function toggleState(abbr: string) {
    setStates(prev => prev.includes(abbr) ? prev.filter(s => s !== abbr) : [...prev, abbr])
  }

  const filteredStates = US_STATES.filter(s =>
    s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
    s.abbr.toLowerCase().includes(stateSearch.toLowerCase())
  )

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent style={{ maxWidth: '480px', padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
        <DialogHeader style={{ marginBottom: '20px' }}>
          <DialogTitle style={{ fontSize: '18px', fontWeight: 500, letterSpacing: '-0.3px', color: '#15151C' }}>
            My preferences
          </DialogTitle>
        </DialogHeader>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#8B8B9E', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Intended major
          </label>
          <Input
            type="text"
            value={major}
            onChange={e => setMajor(e.target.value)}
            placeholder="e.g. Computer Science"
            style={{ fontSize: '14px', height: '42px', borderRadius: '10px', border: '1px solid #DDD9F8', color: '#15151C' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#8B8B9E', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Max tuition — <span style={{ color: '#6366F1' }}>${maxTuition.toLocaleString()}/yr</span>
          </label>
          <input
            type="range" min={5000} max={75000} step={1000}
            value={maxTuition}
            onChange={e => setMaxTuition(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#6366F1' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A8A8BC', marginTop: '4px' }}>
            <span>$5k</span><span>$75k+</span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#8B8B9E', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Preferred states {states.length > 0 && `— ${states.length} selected`}
          </label>

          {states.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {states.map(abbr => {
                const s = US_STATES.find(s => s.abbr === abbr)
                return (
                  <span key={abbr} onClick={() => toggleState(abbr)} style={{
                    fontSize: '12px', padding: '4px 10px',
                    borderRadius: '20px', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white',
                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px',
                  }}>
                    {s?.name} <span style={{ opacity: 0.8 }}>✕</span>
                  </span>
                )
              })}
            </div>
          )}

          <Input
            type="text"
            value={stateSearch}
            onChange={e => setStateSearch(e.target.value)}
            placeholder="Search states..."
            style={{ fontSize: '13px', height: '38px', marginBottom: '8px', borderRadius: '10px', border: '1px solid #DDD9F8', color: '#15151C' }}
          />

          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #EEECFB', borderRadius: '10px' }}>
            {filteredStates.map((s, i) => (
              <div key={s.abbr} onClick={() => toggleState(s.abbr)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', cursor: 'pointer',
                background: states.includes(s.abbr) ? '#F4F3FE' : 'transparent',
                borderBottom: i < filteredStates.length - 1 ? '1px solid #F4F3FE' : 'none',
                transition: 'background 0.1s',
              }}>
                <span style={{
                  fontSize: '13px',
                  color: states.includes(s.abbr) ? '#4338CA' : '#3A3A4D',
                  fontWeight: states.includes(s.abbr) ? 500 : 400,
                }}>
                  {s.name}
                </span>
                {states.includes(s.abbr) && <span style={{ color: '#6366F1', fontSize: '14px' }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSave({ preferred_states: states, max_tuition: maxTuition, preferred_majors: major ? [major] : [] })}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '13px', fontSize: '14px', fontWeight: 500,
            cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.25)',
          }}
        >
          Save preferences
        </button>
      </DialogContent>
    </Dialog>
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
  const [prefs, setPrefs] = useState<UserPreferences>({ preferred_states: [], max_tuition: null, preferred_majors: [] })

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
    if (!sageProfile?.intendedMajor) return "Tell Sage your intended major — it makes a big difference in what comes up."
    if (!sageProfile?.careerGoals?.length) return "Share your career goals with Sage so recommendations actually make sense."
    if (!sageProfile?.preferredLocations?.length) return "Tell Sage where you're thinking of studying — even a rough idea helps."
    if (!hearts.length) return "Heart a school you're curious about and it'll show up here."
    if (!vibes.length) return "Run a Vibe Check on a school to see if the culture actually fits you."
    return "You're all set — Sage knows what it needs to find your fit."
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

  const linkStyle: React.CSSProperties = {
    display: 'inline-block', fontSize: '13px', color: '#6366F1',
    background: '#F4F3FE', border: '1px solid #DDD9F8',
    borderRadius: '10px', padding: '7px 14px',
    textDecoration: 'none', fontWeight: 500,
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '2rem' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: 500, color: 'white', flexShrink: 0,
          boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
        }}>
          {initials}
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#15151C', marginBottom: '2px', letterSpacing: '-0.3px' }}>
            {user.email?.split('@')[0]}'s profile
          </h1>
          <div style={{ fontSize: '13px', color: '#8B8B9E' }}>{user.email}</div>
        </div>
      </div>

      {!loading && <CompletenessBar score={completeness} nudge={getCompletenessNudge()} />}

      {/* What Sage knows */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader
          title="What Sage knows"
          action={<a href="/" style={{ fontSize: '12px', color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>Chat with Sage →</a>}
        />
        {loading ? (
          <Skeleton height={120} />
        ) : !sageProfile || (!sageProfile.intendedMajor && !sageProfile.careerGoals?.length && !sageProfile.preferredLocations?.length) ? (
          <EmptyState
            emoji="💬"
            message="Sage doesn't know much about you yet — start a conversation and it'll fill in fast."
            action={<a href="/" style={linkStyle}>Chat with Sage →</a>}
          />
        ) : (
          <div style={{
            background: 'white', border: '1px solid #EEECFB', borderRadius: '14px', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            boxShadow: '0 2px 12px rgba(99,102,241,0.05)',
          }}>
            {[
              { label: 'Location', value: sageProfile.preferredLocations?.join(', ') },
              { label: 'Intended major', value: sageProfile.intendedMajor },
              { label: 'Career goals', value: sageProfile.careerGoals?.join(', ') },
            ].filter(item => item.value).map(item => (
              <div key={item.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 500, color: '#A8A8BC',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  width: '90px', flexShrink: 0, paddingTop: '2px',
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '13px', color: '#3A3A4D' }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My schools */}
      <div style={{ marginBottom: '2rem' }}>
        <SectionHeader
          title="My schools"
          action={<span style={{ fontSize: '12px', color: '#A8A8BC' }}>{hearts.length} saved</span>}
        />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height={60} /><Skeleton height={60} /><Skeleton height={60} />
          </div>
        ) : hearts.length === 0 ? (
          <EmptyState
            emoji="🏫"
            message="No saved schools yet — heart the ones you love and they'll show up here."
            action={<a href="/search" style={linkStyle}>Browse schools →</a>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hearts.map(h => (
              <div key={h.id} style={{
                background: 'white', border: '1px solid #EEECFB', borderRadius: '14px', padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                boxShadow: '0 2px 8px rgba(99,102,241,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #FCE7F3, #FBCFE8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', color: '#EC4899',
                  }}>♥</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#15151C' }}>{h.college_name}</div>
                    <div style={{ fontSize: '11px', color: '#A8A8BC', marginTop: '2px' }}>
                      Saved {new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <a href={`/college/${h.college_id}`} style={{ fontSize: '12px', color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>
                    View →
                  </a>
                  <button
                    onClick={() => handleUnheart(h.college_id)}
                    style={{ fontSize: '12px', color: '#A8A8BC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
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
          action={<span style={{ fontSize: '12px', color: '#A8A8BC' }}>{vibes.length} saved</span>}
        />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height={80} /><Skeleton height={80} />
          </div>
        ) : vibes.length === 0 ? (
          <EmptyState
            emoji="✨"
            message="No Vibe Checks saved yet — run one on a school you're curious about and see if it actually fits you."
            action={<a href="/search" style={linkStyle}>Find a school →</a>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {vibes.map(v => {
              const fitColor = v.fit_score >= 80 ? '#6366F1' : v.fit_score >= 60 ? '#8B5CF6' : '#A8A8BC'
              return (
                <div key={v.id} style={{
                  background: 'white', border: '1px solid #EEECFB', borderRadius: '14px', overflow: 'hidden',
                  display: 'flex', alignItems: 'stretch',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.04)',
                }}>
                  <div style={{ width: '3px', flexShrink: 0, background: 'linear-gradient(180deg, #6366F1, #EC4899)' }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#15151C' }}>{v.college_name}</span>
                        <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '20px', background: '#F4F3FE', color: '#6366F1', fontWeight: 500 }}>✨ Vibe Check</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#8B8B9E', lineHeight: 1.5 }}>{v.overall_summary}</div>
                      <div style={{ fontSize: '11px', color: '#A8A8BC', marginTop: '4px' }}>
                        {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '24px', fontWeight: 500, color: fitColor }}>{v.fit_score}</div>
                      <div style={{ fontSize: '10px', color: '#A8A8BC' }}>fit</div>
                    </div>
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
            <button onClick={() => setShowPrefsModal(true)} style={{ fontSize: '12px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
              Edit
            </button>
          }
        />
        {loading ? (
          <Skeleton height={100} />
        ) : prefs.preferred_states.length === 0 && !prefs.max_tuition && prefs.preferred_majors.length === 0 ? (
          <EmptyState
            emoji="⚙️"
            message="Set your standing preferences and Sage will use them every time — no need to repeat yourself."
            action={
              <button onClick={() => setShowPrefsModal(true)} style={{
                fontSize: '13px', color: '#6366F1', background: '#F4F3FE',
                border: '1px solid #DDD9F8', borderRadius: '10px',
                padding: '8px 16px', cursor: 'pointer', fontWeight: 500,
              }}>
                Set preferences
              </button>
            }
          />
        ) : (
          <div style={{
            background: 'white', border: '1px solid #EEECFB', borderRadius: '14px', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            boxShadow: '0 2px 12px rgba(99,102,241,0.05)',
          }}>
            {prefs.preferred_states.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#A8A8BC', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px', flexShrink: 0, paddingTop: '2px' }}>States</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {prefs.preferred_states.map(s => (
                    <span key={s} style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '20px', background: '#F4F3FE', color: '#4338CA', border: '1px solid #DDD9F8', fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {prefs.max_tuition != null && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#A8A8BC', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px', flexShrink: 0 }}>Max tuition</div>
                <div style={{ fontSize: '13px', color: '#3A3A4D' }}>${prefs.max_tuition.toLocaleString()}/yr</div>
              </div>
            )}
            {prefs.preferred_majors.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#A8A8BC', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px', flexShrink: 0 }}>Major</div>
                <div style={{ fontSize: '13px', color: '#3A3A4D' }}>{prefs.preferred_majors.join(', ')}</div>
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
