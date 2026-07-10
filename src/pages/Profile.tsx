import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { useChat } from '@/context/ChatContext'
import { useColleges } from '@/context/CollegeContext'
import { useSavedVibes } from '@/context/SavedVibesContext'
import { supabase } from '@/lib/supabase'
import type { College } from '@/lib/colleges'
import { scoreCollege } from '@/lib/matchScore'
import { REGION_TO_STATES } from '@/lib/regions'
import AuthModal from '@/components/ui/AuthModal'
import Modal from '@/components/ui/Modal'
import SageOrb from '@/components/sage/SageOrb'
import {
  ensureDeadline,
  getCachedDeadlines,
  upcomingWithin,
  nearestUpcomingDeadline,
  roundLabel,
  formatDeadlineDate,
  type CollegeDeadlines,
} from '@/lib/deadlines'

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

interface DisplayHeartedSchool {
  id: string
  college_id: string
  college_name: string
  location?: string
  created_at?: string
  college?: College
}

interface UserPreferences {
  preferred_states: string[]
  max_tuition: number | null
  preferred_majors: string[]
  preferredSize?: 'small' | 'medium' | 'large' | null
  preferredInstitutionType?: 'two_year' | 'four_year' | 'either' | null
}

type SizePreference = NonNullable<UserPreferences['preferredSize']>
type InstitutionTypePreference = NonNullable<UserPreferences['preferredInstitutionType']>

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

function ringColor(score: number) {
  if (score >= 80) return 'var(--admyt-teal)'
  if (score >= 60) return 'var(--admyt-indigo)'
  return 'var(--admyt-faint)'
}

const SIZE_LABELS: Record<SizePreference, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
}

const INSTITUTION_TYPE_LABELS: Record<InstitutionTypePreference, string> = {
  two_year: 'Two-year',
  four_year: 'Four-year',
  either: 'Open to either',
}

const REGION_PICKERS = [
  'pacific northwest',
  'new england',
  'midwest',
  'south',
  'southwest',
  'mountain west',
  'west coast',
  'mid-atlantic',
  'northeast',
  'great lakes',
  'deep south',
] as const

function humanizeRegion(region: string) {
  return region.split(/[\s-]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function PreferenceRows({ prefs }: { prefs: UserPreferences }) {
  const rows = [
    prefs.preferred_states.length ? ['States', prefs.preferred_states.join(', ')] : null,
    prefs.max_tuition != null ? ['Max tuition', `$${prefs.max_tuition.toLocaleString()}/yr`] : null,
    prefs.preferred_majors.length ? ['Major', prefs.preferred_majors.join(', ')] : null,
    prefs.preferredSize ? ['Size', SIZE_LABELS[prefs.preferredSize]] : null,
    prefs.preferredInstitutionType ? ['Institution type', INSTITUTION_TYPE_LABELS[prefs.preferredInstitutionType]] : null,
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

function PreferencesModal({
  prefs,
  sageProfile,
  onSave,
  onClose,
}: {
  prefs: UserPreferences
  sageProfile: ReturnType<typeof useProfile>['profile']
  onSave: (p: UserPreferences) => Promise<void>
  onClose: () => void
}) {
  const sageMajor = sageProfile?.intendedMajor ?? sageProfile?.preferredMajors?.[0] ?? ''
  const initialStates = prefs.preferred_states.length ? prefs.preferred_states : (sageProfile?.preferredStates ?? [])
  const initialMajor = prefs.preferred_majors[0] ?? sageMajor
  const majorFromSage = !prefs.preferred_majors.length && !!sageMajor
  const statesFromSage = !prefs.preferred_states.length && initialStates.length > 0
  const sizeFromSage = !!sageProfile?.preferredSize
  const institutionTypeFromSage = !!sageProfile?.preferredInstitutionType

  const [states, setStates] = useState<string[]>(initialStates)
  const [maxTuition, setMaxTuition] = useState(prefs.max_tuition ?? 70000)
  const [major, setMajor] = useState(initialMajor)
  const [preferredSize, setPreferredSize] = useState<UserPreferences['preferredSize']>(sageProfile?.preferredSize ?? null)
  const [preferredInstitutionType, setPreferredInstitutionType] = useState<UserPreferences['preferredInstitutionType']>(sageProfile?.preferredInstitutionType ?? null)
  const [stateSearch, setStateSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  function toggleState(abbr: string) {
    setStates(prev => prev.includes(abbr) ? prev.filter(s => s !== abbr) : [...prev, abbr])
  }

  function toggleRegion(region: (typeof REGION_PICKERS)[number]) {
    const regionStates = REGION_TO_STATES[region] ?? []
    setStates(prev => {
      const hasAll = regionStates.every(state => prev.includes(state))
      if (hasAll) return prev.filter(state => !regionStates.includes(state))
      return [...prev, ...regionStates.filter(state => !prev.includes(state))]
    })
  }

  async function savePreferences() {
    setSaving(true)
    setSaveMessage('')
    await onSave({
      preferred_states: states,
      max_tuition: maxTuition,
      preferred_majors: major.trim() ? [major.trim()] : [],
      preferredSize: preferredSize ?? null,
      preferredInstitutionType: preferredInstitutionType ?? null,
    })
    setSaveMessage('Saved — Sage will use these in your matches.')
    window.setTimeout(onClose, 900)
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
          <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--admyt-ink)', marginBottom: 8 }}>
            Preferred major
            {majorFromSage && <span className="match-note" style={{ marginLeft: 8, fontSize: 12, fontWeight: 650 }}>from your chats with Sage</span>}
          </label>
          <input className="field" value={major} onChange={e => setMajor(e.target.value)} placeholder="e.g. Computer Science" style={{ height: 44 }} />
        </section>

        <section className="mock-card section-pad">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 800, color: 'var(--admyt-ink)' }}>Max tuition</label>
            <span className="pill teal" style={{ fontWeight: 850 }}>${maxTuition.toLocaleString()}/yr</span>
          </div>
          <input type="range" min={5000} max={75000} step={1000} value={maxTuition} onChange={e => setMaxTuition(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366F1' }} />
        </section>

        <section className="mock-card section-pad">
          <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--admyt-ink)', marginBottom: 10 }}>
            Campus size
            {sizeFromSage && <span className="match-note" style={{ marginLeft: 8, fontSize: 12, fontWeight: 650 }}>from your chats with Sage</span>}
          </label>
          <div className="filters">
            {(['small', 'medium', 'large'] as const).map(size => (
              <button
                key={size}
                className={`pill ${preferredSize === size ? 'teal' : ''}`}
                onClick={() => setPreferredSize(prev => prev === size ? null : size)}
              >
                {SIZE_LABELS[size]}
              </button>
            ))}
          </div>
        </section>

        <section className="mock-card section-pad">
          <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--admyt-ink)', marginBottom: 10 }}>
            Institution type
            {institutionTypeFromSage && <span className="match-note" style={{ marginLeft: 8, fontSize: 12, fontWeight: 650 }}>from your chats with Sage</span>}
          </label>
          <div className="filters">
            {(['two_year', 'four_year', 'either'] as const).map(type => (
              <button
                key={type}
                className={`pill ${preferredInstitutionType === type ? 'teal' : ''}`}
                onClick={() => setPreferredInstitutionType(prev => prev === type ? null : type)}
              >
                {INSTITUTION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </section>

        <section className="mock-card section-pad">
          <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--admyt-ink)', marginBottom: 10 }}>
            Preferred states {states.length ? `— ${states.length} selected` : ''}
            {statesFromSage && <span className="match-note" style={{ marginLeft: 8, fontSize: 12, fontWeight: 650 }}>from your chats with Sage</span>}
          </label>
          <div className="filters" style={{ marginBottom: 12 }}>
            {REGION_PICKERS.map(region => {
              const regionStates = REGION_TO_STATES[region] ?? []
              const selected = regionStates.length > 0 && regionStates.every(state => states.includes(state))
              return (
                <button
                  className={`pill ${selected ? 'teal' : ''}`}
                  key={region}
                  onClick={() => toggleRegion(region)}
                >
                  {humanizeRegion(region)}
                </button>
              )
            })}
          </div>
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

        {saveMessage && <p className="match-note" style={{ margin: 0, fontWeight: 750, color: 'var(--admyt-teal)' }}>{saveMessage}</p>}
        <button className="btn" disabled={saving} onClick={savePreferences}>
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </Modal>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { profile: sageProfile, mergeProfile } = useProfile()
  const { heartedSchools, toggleHeart } = useChat()
  const { colleges, loading: collegesLoading } = useColleges()
  const { vibeScoreFor } = useSavedVibes()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPrefsModal, setShowPrefsModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hearts, setHearts] = useState<HeartedSchool[]>([])
  const [vibes, setVibes] = useState<SavedVibe[]>([])
  const [prefs, setPrefs] = useState<UserPreferences>({ preferred_states: [], max_tuition: null, preferred_majors: [] })
  const [deadlines, setDeadlines] = useState<Record<string, CollegeDeadlines>>({})
  const collegeById = useMemo(() => new Map(colleges.map(c => [c.id, c])), [colleges])

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

  // Load cached deadlines for the hearted schools, then fetch any that are missing
  // (first time a school is favorited) so they're populated for next time.
  useEffect(() => {
    if (!user || hearts.length === 0) { setDeadlines({}); return }
    let cancelled = false
    const ids = hearts.map(h => h.college_id)
    getCachedDeadlines(ids).then(map => {
      if (cancelled) return
      setDeadlines(map)
      ids.filter(id => !map[id]).forEach(id => {
        ensureDeadline(id).then(d => {
          if (!cancelled && d) setDeadlines(prev => ({ ...prev, [id]: d }))
        })
      })
    })
    return () => { cancelled = true }
  }, [user, hearts])

  const nameById = useMemo(
    () => Object.fromEntries(hearts.map(h => [h.college_id, h.college_name])),
    [hearts],
  )
  const guestHearts = useMemo<DisplayHeartedSchool[]>(
    () => [...heartedSchools].map(id => {
      const college = collegeById.get(id)
      return {
        id,
        college_id: id,
        college_name: college?.name ?? 'Saved school',
        location: college?.location,
        college,
      }
    }).filter(h => h.college),
    [heartedSchools, collegeById],
  )
  const visibleHearts: DisplayHeartedSchool[] = user ? hearts : guestHearts
  const mySchoolsLoading = user ? (loading || (collegesLoading && hearts.length > 0)) : collegesLoading && heartedSchools.size > 0
  const savedSchoolCount = user ? hearts.length : heartedSchools.size
  const upcoming = useMemo(() => upcomingWithin(60, deadlines, nameById), [deadlines, nameById])
  const nearestDeadline = useMemo(() => nearestUpcomingDeadline(deadlines, nameById), [deadlines, nameById])
  const hasKnownDeadlines = useMemo(
    () => Object.values(deadlines).some(d => d.rolling || (d.rounds ?? []).length > 0),
    [deadlines],
  )
  const todayISO = new Date().toISOString().slice(0, 10)

  async function handleUnheart(collegeId: string) {
    if (!user) {
      const college = collegeById.get(collegeId)
      if (college) toggleHeart(college)
      return
    }
    await supabase.from('hearted_schools').delete().eq('user_id', user.id).eq('college_id', collegeId)
    setHearts(prev => prev.filter(h => h.college_id !== collegeId))
  }

  async function handleSavePrefs(newPrefs: UserPreferences) {
    if (!user) return
    const { preferredSize, preferredInstitutionType, ...preferenceColumns } = newPrefs
    const profileUpdate = {
      preferredStates: newPrefs.preferred_states,
      maxTuition: newPrefs.max_tuition,
      preferredMajors: newPrefs.preferred_majors,
      preferredSize: preferredSize ?? null,
      preferredInstitutionType: preferredInstitutionType ?? null,
    }
    const sageProfileForPersistence = {
      ...sageProfile,
      ...profileUpdate,
    }

    await supabase.from('user_preferences').upsert(
      { user_id: user.id, ...preferenceColumns, sage_profile: sageProfileForPersistence },
      { onConflict: 'user_id' },
    )
    setPrefs(newPrefs)
    mergeProfile(profileUpdate)
  }

  function getCompleteness() {
    let score = 0
    if (sageProfile?.intendedMajor) score += 20
    if (sageProfile?.careerGoals?.length) score += 20
    if (sageProfile?.preferredLocations?.length) score += 20
    if (savedSchoolCount > 0) score += 20
    if (vibes.length > 0) score += 20
    return score
  }

  function getCompletenessNudges() {
    const hasSavedVibe = user ? vibes.length > 0 : false
    const profileIsThin = !(
      sageProfile?.intendedMajor &&
      sageProfile?.careerGoals?.length &&
      sageProfile?.preferredLocations?.length
    )

    const nudges: string[] = []
    if (savedSchoolCount === 0) nudges.push("Heart a school you're curious about")
    if (savedSchoolCount > 0 && !hasSavedVibe) nudges.push('Run a Vibe Check on one of your schools')
    if (savedSchoolCount === 1) nudges.push('Heart a second school to compare')
    if (profileIsThin) nudges.push('Tell Sage a bit more')

    return nudges.length ? nudges : ["You're set. Sage has enough to give you a sharper read."]
  }

  const completeness = user ? getCompleteness() : 48
  const completenessNudges = getCompletenessNudges()
  const topNudge = completenessNudges[0]
  const sageNudges = completenessNudges.slice(1, 3)
  const initials = user?.email?.charAt(0).toUpperCase() ?? 'Y'
  const hasSageFacts = !!(sageProfile?.intendedMajor || sageProfile?.careerGoals?.length || sageProfile?.preferredLocations?.length)

  return (
    <div className="app-frame">
      <section className="profile-hero">
        <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--admyt-grad)', color: 'white', fontWeight: 850, fontSize: 24, flexShrink: 0 }}>
          {user ? initials : <SageOrb size={52} />}
        </div>
        <div style={{ flex: 1, minWidth: user ? 0 : 200 }}>
          <h1 style={user ? undefined : { fontSize: 'clamp(18px, 5vw, 24px)' }}>{user ? 'Your Admyt profile' : "This becomes Sage's memory."}</h1>
          <p style={user ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : undefined}>{user ? user.email : 'Save your schools, Vibe Checks, conversation, and preferences so Sage can pick up where you left off.'}</p>
        </div>
        {user
          ? <button className="btn secondary" onClick={() => signOut()}>Sign out</button>
          : <button className="btn" onClick={() => setShowAuthModal(true)}>Create a free account</button>}
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

          {user && (
            <section className="mock-card section-pad">
              <div className="school-head">
                <span className="mini-title">Upcoming deadlines</span>
                <span className="pill">Next 60 days</span>
              </div>
              <div style={{ marginTop: 12 }}>
                {upcoming.length ? (
                  <div className="learn-list">
                    {upcoming.map(u => (
                      <div className="learn-item" key={`${u.collegeId}-${u.type}-${u.date}`}>
                        <span>
                          {u.collegeName} · {roundLabel(u.type)}
                          {u.sourceUrl && (
                            <a href={u.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, fontSize: 11, color: 'var(--admyt-indigo)' }}>
                              source
                            </a>
                          )}
                        </span>
                        <span>{formatDeadlineDate(u.date)} · {u.daysAway === 0 ? 'today' : `${u.daysAway}d`}</span>
                      </div>
                    ))}
                  </div>
                ) : savedSchoolCount === 0 ? (
                  <p className="match-note">Heart schools and I'll track their application dates here.</p>
                ) : !hasKnownDeadlines ? (
                  <p className="match-note">I'm still gathering dates for your schools. They'll show up here as Sage finds them.</p>
                ) : nearestDeadline ? (
                  <p className="match-note">
                    {nearestDeadline.collegeName}'s first deadline is {roundLabel(nearestDeadline.type)} · {formatDeadlineDate(nearestDeadline.date)} — {nearestDeadline.daysAway === 0 ? 'today' : `${nearestDeadline.daysAway} days out`}.
                  </p>
                ) : (
                  <p className="match-note">No upcoming deadlines found yet. Keep these schools saved and I'll keep watching for fresh dates.</p>
                )}
                <p className="match-note" style={{ marginTop: 10, fontSize: 12 }}>
                  Dates are gathered from each school's site — always confirm on their official admissions page before you rely on them.
                </p>
              </div>
            </section>
          )}

          <section className="mock-card section-pad">
            <div className="school-head">
              <span className="mini-title">My Schools</span>
              <span className="pill">{savedSchoolCount} saved</span>
            </div>
            <div className="timeline" style={{ marginTop: 12 }}>
              {mySchoolsLoading ? <><Skeleton height={62} /><Skeleton height={62} /></> : visibleHearts.length ? (
                <>
                  {visibleHearts.map(h => {
                    const college = h.college ?? collegeById.get(h.college_id)
                    const vibeScore = vibeScoreFor(h.college_id)
                    const score = college ? (vibeScore ?? scoreCollege(college, sageProfile)) : null
                    return (
                      <div
                        className="saved-row mock-soft-card"
                        key={h.id}
                        onClick={() => navigate(`/college/${h.college_id}`)}
                        role="link"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') navigate(`/college/${h.college_id}`)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div>
                          <h3>{h.college_name}</h3>
                          {h.created_at ? (
                            <p>Saved {new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          ) : h.location ? (
                            <p>{h.location}</p>
                          ) : null}
                          {user && (() => {
                            const d = deadlines[h.college_id]
                            if (!d) return null
                            if (d.rolling) return <div className="filters" style={{ marginTop: 6 }}><span className="pill">Rolling admissions</span></div>
                            const future = (d.rounds ?? []).filter(r => r.date >= todayISO)
                            if (!future.length) return null
                            return (
                              <div className="filters" style={{ marginTop: 6 }}>
                                {future.slice(0, 4).map(r => (
                                  <span className="pill" key={`${r.type}-${r.date}`}>{roundLabel(r.type)} · {formatDeadlineDate(r.date)}</span>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                        <div className="filters" style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                          {score != null && (
                            <div className="score-stack">
                              <div className="score" style={{ width: 54, height: 54, background: `conic-gradient(${ringColor(score)} 0 ${score}%, #eeeaf8 ${score}% 100%)` }}>
                                <strong style={{ width: 40, height: 40, fontSize: 14 }}>{score}</strong>
                              </div>
                              <span className="score-label">Fit Score</span>
                              {vibeScore !== undefined && <span className="pill vibe-refined">Refined by your Vibe Check</span>}
                            </div>
                          )}
                          <button className="pill" onClick={e => { e.stopPropagation(); handleUnheart(h.college_id) }}>Remove</button>
                        </div>
                      </div>
                    )
                  })}
                  {!user && (
                    <div className="callout">
                      <p style={{ marginTop: 0 }}>Nice list. Create a free account when you're ready, and Sage can keep these schools with the rest of your college search.</p>
                      <button className="btn" onClick={() => setShowAuthModal(true)}>Sign up to keep these</button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState message="No saved schools yet — heart the ones you're curious about and they'll show up here." action={<button className="btn secondary" onClick={() => navigate('/search')}>Browse schools</button>} />
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
              {prefs.preferred_states.length || prefs.max_tuition || prefs.preferred_majors.length || prefs.preferredSize || prefs.preferredInstitutionType || sageProfile?.preferredSize || sageProfile?.preferredInstitutionType ? (
                <PreferenceRows prefs={{ ...prefs, preferredSize: sageProfile?.preferredSize ?? prefs.preferredSize, preferredInstitutionType: sageProfile?.preferredInstitutionType ?? prefs.preferredInstitutionType }} />
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
            <p className="match-note" style={{ marginTop: 12 }}>{topNudge}</p>
          </section>

          <section className="callout">
            <strong>Sage nudges</strong>
            {sageNudges.length ? (
              sageNudges.map(nudge => <p key={nudge}>{nudge}</p>)
            ) : (
              <p>No extra homework right now. Ask Sage when you want a sharper compare.</p>
            )}
            <button className="btn" onClick={() => navigate('/chat')} style={{ marginTop: 14, width: '100%' }}>Ask Sage</button>
          </section>
        </aside>
      </div>

      {showPrefsModal && <PreferencesModal prefs={prefs} sageProfile={sageProfile} onSave={handleSavePrefs} onClose={() => setShowPrefsModal(false)} />}
      {showAuthModal && <AuthModal trigger="general" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}
      <style>{`@keyframes profilePulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}
