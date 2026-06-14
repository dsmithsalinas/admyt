import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { supabase } from '@/lib/supabase'
import AuthModal from '@/components/ui/AuthModal'
import Modal from '@/components/ui/Modal'
import SageOrb from '@/components/sage/SageOrb'

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
  { abbr: 'AK', name: 'Alaska' }, { abbr: 'AL', name: 'Alabama' }, { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'AZ', name: 'Arizona' }, { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DC', name: 'Washington D.C.' }, { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' }, { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'IA', name: 'Iowa' }, { abbr: 'ID', name: 'Idaho' }, { abbr: 'IL', name: 'Illinois' },
  { abbr: 'IN', name: 'Indiana' }, { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' }, { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MD', name: 'Maryland' },
  { abbr: 'ME', name: 'Maine' }, { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MS', name: 'Mississippi' }, { abbr: 'MT', name: 'Montana' },
  { abbr: 'NC', name: 'North Carolina' }, { abbr: 'ND', name: 'North Dakota' }, { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' }, { abbr: 'NM', name: 'New Mexico' },
  { abbr: 'NV', name: 'Nevada' }, { abbr: 'NY', name: 'New York' }, { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' }, { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' }, { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' }, { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' },
  { abbr: 'VA', name: 'Virginia' }, { abbr: 'VT', name: 'Vermont' }, { abbr: 'WA', name: 'Washington' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WV', name: 'West Virginia' }, { abbr: 'WY', name: 'Wyoming' },
]

function Skeleton({ height = 80 }: { height?: number }) {
  return <div className="mock-card" style={{ height, animation: 'profilePulse 1.5s ease-in-out infinite' }} />
}

function EmptyState({ message, action }: { message: string; action: React.ReactNode }) {
  return (
    <div className="callout">
      <p style={{ marginTop: 0 }}>{message}</p>
      <div style={{ marginTop: 14 }}>{action}</div>
    </div>
  )
}

function PreferenceRows({ prefs }: { prefs: UserPreferences }) {
  const rows = [
    prefs.preferred_states.length ? ['States', prefs.preferred_states.join(', ')] : null,
    prefs.max_tuition != null ? ['Max tuition', `$${prefs.max_tuition.toLocaleString()}/yr`] : null,
    prefs.preferred_majors.length ? ['Major', prefs.preferred_majors.join(', ')] : null,
  ].filter(Boolean) as string[][]

  return (
    <div className="learn-list">
      {rows.map(([label, value]) => (
        <div className="learn-item" key={label}>
          <span>{label}</span>
          <span>{value}</span>
        </div>
      ))}
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
    <Modal onClose={onClose} labelledBy="prefs-modal-title" panelStyle={{ maxWidth: 560, padding: 0, maxHeight: '86vh' }}>
      <div className="frame-head">
        <h2 id="prefs-modal-title" style={{ fontSize: 18, color: 'var(--admyt-ink)', margin: 0 }}>My preferences</h2>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>

      <div className="section-pad" style={{ display: 'grid', gap: 14 }}>
        <section className="mock-card section-pad">
          <label className="mini-title" style={{ display: 'block' }}>Preferred major</label>
          <input className="field" value={major} onChange={e => setMajor(e.target.value)} placeholder="e.g. Computer Science" style={{ height: 44 }} />
        </section>

        <section className="mock-card section-pad">
          <label className="mini-title" style={{ display: 'block' }}>Max tuition — ${maxTuition.toLocaleString()}/yr</label>
          <input type="range" min={5000} max={75000} step={1000} value={maxTuition} onChange={e => setMaxTuition(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366F1' }} />
        </section>

        <section className="mock-card section-pad">
          <label className="mini-title" style={{ display: 'block' }}>Preferred states {states.length ? `— ${states.length} selected` : ''}</label>
          {states.length > 0 && (
            <div className="filters" style={{ marginBottom: 12 }}>
              {states.map(abbr => <button className="pill teal" key={abbr} onClick={() => toggleState(abbr)}>{abbr} ×</button>)}
            </div>
          )}
          <input className="field" value={stateSearch} onChange={e => setStateSearch(e.target.value)} placeholder="Search states..." style={{ height: 40, marginBottom: 10 }} />
          <div className="mock-soft-card" style={{ maxHeight: 190, overflow: 'auto' }}>
            {filteredStates.map(s => (
              <button
                key={s.abbr}
                onClick={() => toggleState(s.abbr)}
                className="saved-row"
                style={{ width: '100%', border: 0, borderBottom: '1px solid var(--admyt-line)', background: states.includes(s.abbr) ? '#f1fffc' : 'white', cursor: 'pointer', textAlign: 'left' }}
              >
                <span>{s.name}</span>
                <strong>{states.includes(s.abbr) ? '✓' : s.abbr}</strong>
              </button>
            ))}
          </div>
        </section>

        <button className="btn" onClick={() => onSave({ preferred_states: states, max_tuition: maxTuition, preferred_majors: major ? [major] : [] })}>
          Save preferences
        </button>
      </div>
    </Modal>
  )
}

export default function Profile() {
  const navigate = useNavigate()
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
    if (!sageProfile?.intendedMajor) return 'Tell Sage your intended major. It changes what shows up.'
    if (!sageProfile?.careerGoals?.length) return 'Share your career goals so recommendations make more sense.'
    if (!sageProfile?.preferredLocations?.length) return "Tell Sage where you're thinking of studying, even roughly."
    if (!hearts.length) return "Heart a school you're curious about. It gives Sage a real signal."
    if (!vibes.length) return 'Run a Vibe Check so Sage can learn what culture fits you.'
    return "You're all set. Sage has enough to make a much sharper read."
  }

  const completeness = user ? getCompleteness() : 48
  const initials = user?.email?.charAt(0).toUpperCase() ?? 'Y'
  const hasSageFacts = !!(sageProfile?.intendedMajor || sageProfile?.careerGoals?.length || sageProfile?.preferredLocations?.length)

  return (
    <div className="app-frame">
      <section className="profile-hero">
        <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--admyt-grad)', color: 'white', fontWeight: 850, fontSize: 24 }}>
          {user ? initials : <SageOrb size={52} />}
        </div>
        <div style={{ flex: 1 }}>
          <h1>{user ? 'Your Admyt profile' : "This becomes Sage's memory."}</h1>
          <p>{user ? user.email : 'Save your schools, Vibe Checks, conversation, and preferences so Sage can pick up where you left off.'}</p>
        </div>
        {!user && <button className="btn" onClick={() => setShowAuthModal(true)}>Create a free account</button>}
      </section>

      <div className="profile-layout">
        <main className="timeline">
          <section className="mock-card section-pad">
            <div className="school-head">
              <div>
                <span className="mini-title">What Sage knows</span>
                <p className="match-note" style={{ marginTop: 8 }}>Your conversation signals, organized so recommendations feel less random.</p>
              </div>
              <button className="btn secondary" onClick={() => navigate('/chat')}>Chat</button>
            </div>
            <div style={{ marginTop: 14 }}>
              {loading ? <Skeleton height={100} /> : hasSageFacts ? (
                <div className="learn-list">
                  {[
                    ['Location', sageProfile?.preferredLocations?.join(', ')],
                    ['Intended major', sageProfile?.intendedMajor],
                    ['Career goals', sageProfile?.careerGoals?.join(', ')],
                  ].filter(([, value]) => value).map(([label, value]) => (
                    <div className="learn-item" key={label}><span>{label}</span><span>{value}</span></div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Sage doesn't know much about you yet. Start a conversation and this fills in fast." action={<button className="btn secondary" onClick={() => navigate('/chat')}>Chat with Sage</button>} />
              )}
            </div>
          </section>

          <section className="mock-card section-pad">
            <div className="school-head">
              <span className="mini-title">My Schools</span>
              <span className="pill">{hearts.length} saved</span>
            </div>
            <div className="timeline" style={{ marginTop: 12 }}>
              {loading ? <><Skeleton height={62} /><Skeleton height={62} /></> : hearts.length ? hearts.map(h => (
                <div className="saved-row mock-soft-card" key={h.id}>
                  <div>
                    <h3>{h.college_name}</h3>
                    <p>Saved {new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="filters">
                    <button className="pill teal" onClick={() => navigate(`/college/${h.college_id}`)}>View</button>
                    <button className="pill" onClick={() => handleUnheart(h.college_id)}>Remove</button>
                  </div>
                </div>
              )) : (
                <EmptyState message="No saved schools yet — heart the ones you love and they'll show up here." action={<button className="btn secondary" onClick={() => navigate('/search')}>Browse schools</button>} />
              )}
            </div>
          </section>

          <section className="mock-card section-pad">
            <div className="school-head">
              <span className="mini-title">Vibe Checks</span>
              <span className="pill">{vibes.length} saved</span>
            </div>
            <div className="timeline" style={{ marginTop: 12 }}>
              {loading ? <><Skeleton height={86} /><Skeleton height={86} /></> : vibes.length ? vibes.map(v => (
                <div className="saved-row mock-soft-card" key={v.id}>
                  <div>
                    <h3>{v.college_name}</h3>
                    <p>{v.overall_summary}</p>
                  </div>
                  <div className="score" style={{ width: 54, height: 54, background: `conic-gradient(var(--admyt-teal) 0 ${v.fit_score}%, #eeeaf8 ${v.fit_score}% 100%)` }}>
                    <strong style={{ width: 40, height: 40, fontSize: 14 }}>{v.fit_score}</strong>
                  </div>
                </div>
              )) : (
                <EmptyState message="No Vibe Checks saved yet. Run one on a school you're curious about and see if it actually fits you." action={<button className="btn secondary" onClick={() => navigate('/search')}>Find a school</button>} />
              )}
            </div>
          </section>

          <section className="mock-card section-pad">
            <div className="school-head">
              <span className="mini-title">My preferences</span>
              {user && <button className="pill teal" onClick={() => setShowPrefsModal(true)}>Edit</button>}
            </div>
            <div style={{ marginTop: 12 }}>
              {prefs.preferred_states.length || prefs.max_tuition || prefs.preferred_majors.length ? (
                <PreferenceRows prefs={prefs} />
              ) : (
                <EmptyState message="Set standing preferences so Sage can use them without making you repeat yourself." action={user ? <button className="btn secondary" onClick={() => setShowPrefsModal(true)}>Set preferences</button> : <button className="btn secondary" onClick={() => setShowAuthModal(true)}>Sign up to save</button>} />
              )}
            </div>
          </section>
        </main>

        <aside className="sage-panel">
          <section className="mock-soft-card section-pad">
            <span className="mini-title">Profile strength</span>
            <h2 style={{ margin: '8px 0', fontSize: 34, color: 'var(--admyt-ink)' }}>{completeness}%</h2>
            <div className="bar"><span style={{ width: `${completeness}%` }} /></div>
            <p className="match-note" style={{ marginTop: 12 }}>{getCompletenessNudge()}</p>
          </section>

          <section className="callout">
            <strong>Sage nudges</strong>
            <p>{getCompletenessNudge()}</p>
            <p>{hearts.length > 1 ? "You've got a few saved schools. Ask Sage how they stack up." : "Heart one school you're curious about. It gives Sage a real signal."}</p>
            <button className="btn" onClick={() => navigate('/chat')} style={{ marginTop: 14, width: '100%' }}>Ask Sage</button>
          </section>
        </aside>
      </div>

      {showPrefsModal && <PreferencesModal prefs={prefs} onSave={handleSavePrefs} onClose={() => setShowPrefsModal(false)} />}
      {showAuthModal && <AuthModal trigger="general" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}
      <style>{`@keyframes profilePulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}
