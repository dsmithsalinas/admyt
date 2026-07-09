import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useColleges } from '@/context/CollegeContext'
import { useProfile } from '@/context/ProfileContext'
import { useChatContext } from '@/context/ChatContext'
import { scoreCollege, hasEnoughProfileForScore } from '@/lib/matchScore'
import { typeLabel } from '@/lib/colleges'
import type { College } from '@/lib/colleges'
import HeartButton from '@/components/ui/HeartButton'

// Top of the tuition slider. Above the most expensive school in the catalog
// (~$72k), so parking the slider here means "no tuition limit" rather than
// silently filtering out the priciest schools.
const TUITION_MAX = 80000

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

function whyFit(college: College, score: number, profile: ReturnType<typeof useProfile>['profile']) {
  if (profile?.intendedMajor && college.majors.some(m => m.toLowerCase().includes(profile.intendedMajor!.toLowerCase()))) {
    return `${profile.intendedMajor} is one reason Sage pulled this up.`
  }
  if (profile?.preferredLocations?.some(loc => college.location.toLowerCase().includes(loc.toLowerCase()) || college.state === loc)) {
    return `This matches a location signal Sage has heard from you.`
  }
  if (score >= 80) return 'Strong fit based on what Sage knows so far.'
  if (score >= 60) return 'A solid maybe. Worth checking the tradeoffs.'
  return 'Good for comparison while your preferences get sharper.'
}

function CollegeCard({ college, profile }: { college: College; profile: ReturnType<typeof useProfile>['profile'] }) {
  const score = scoreCollege(college, profile)
  const showScore = hasEnoughProfileForScore(profile)
  const navigate = useNavigate()
  const { heartedSchools, toggleHeart } = useChatContext()
  const isHearted = heartedSchools.has(college.id)
  const tuition = college.tuitionInState ?? college.tuitionOutState
  const typeChip = typeLabel(college.type)
  const sizeLabel = college.size.charAt(0).toUpperCase() + college.size.slice(1)
  const fitRead = whyFit(college, score, profile)

  const chips = [
    typeChip, sizeLabel,
    college.acceptanceRate != null ? `${college.acceptanceRate}% admit` : null,
    tuition != null ? `$${(tuition / 1000).toFixed(0)}k/yr` : null,
  ].filter(Boolean) as string[]

  const keywords = [
    ...(profile?.careerGoals ?? []),
    ...(profile?.intendedMajor ? [profile.intendedMajor] : []),
  ].map(k => k.toLowerCase())

  const sortedMajors = [...college.majors].sort((a, b) => {
    const aMatch = keywords.some(k => a.toLowerCase().includes(k) || k.includes(a.toLowerCase()))
    const bMatch = keywords.some(k => b.toLowerCase().includes(k) || k.includes(b.toLowerCase()))
    return (bMatch ? 1 : 0) - (aMatch ? 1 : 0)
  })

  const majorChips = sortedMajors.slice(0, 2).map(m =>
    m.length > 28 ? m.slice(0, 27) + '…' : m
  )

  return (
    <div
      onClick={() => navigate(`/college/${college.id}`)}
      className="mock-card school-card"
      style={{ cursor: 'pointer' }}
    >
      <div className="school-head">
        <div>
          <h3>{college.name}</h3>
          <p>{college.location}</p>
        </div>
        <div className="score-stack">
          {showScore ? (
            <>
              <div className="score" style={{ background: `conic-gradient(var(--admyt-teal) 0 ${score}%, #eeeaf8 ${score}% 100%)` }}>
                <strong>{score}</strong>
              </div>
              <span className="score-label">Fit Score</span>
            </>
          ) : (
            <div style={{
              fontSize: '11px',
              color: '#A8A8BC',
              textAlign: 'center',
              maxWidth: '52px',
              lineHeight: 1.3,
            }}>
              Chat with Sage to get your score
            </div>
          )}
        </div>
      </div>

      <p className="match-note">{fitRead}</p>

      <div className="filters">
        {chips.map(tag => (
          <span className="pill" key={tag}>{tag}</span>
        ))}
        {majorChips.map(major => <span className="pill teal" key={major}>{major}</span>)}
      </div>

      <div className="card-actions">
        <button className="btn secondary" onClick={e => { e.stopPropagation(); navigate(`/college/${college.id}`) }}>
          Details
        </button>
        <button
          className="btn teal"
          onClick={e => { e.stopPropagation(); navigate(`/college/${college.id}/vibe`) }}
        >
          Vibe Check
        </button>
        <HeartButton active={isHearted} onClick={e => { e.stopPropagation(); toggleHeart(college) }} size={30} />
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="mock-card" style={{ height: '180px', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
  )
}

export default function Search() {
  const { profile } = useProfile()
  const { colleges, loading } = useColleges()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [maxTuition, setMaxTuition] = useState(TUITION_MAX)
  const [selectedMajor, setSelectedMajor] = useState('')
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  const allMajors = useMemo(() => Array.from(new Set(colleges.flatMap(c => c.majors))).sort(), [colleges])

  const filtered = useMemo(() => {
    return colleges
      .filter(c => {
        if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.location.toLowerCase().includes(query.toLowerCase())) return false
        if (selectedState && c.state !== selectedState) return false
        if (selectedSize && c.size !== selectedSize) return false
        if (selectedType && c.type !== selectedType) return false
        const tuition = c.tuitionInState ?? c.tuitionOutState
        if (maxTuition < TUITION_MAX && tuition != null && tuition > maxTuition) return false
        if (selectedMajor && !c.majors.includes(selectedMajor)) return false
        return true
      })
      .sort((a, b) => scoreCollege(b, profile) - scoreCollege(a, profile))
  }, [colleges, query, selectedState, selectedSize, selectedType, maxTuition, selectedMajor, profile])

  const activeFilters = [selectedState, selectedSize, selectedType, selectedMajor].filter(Boolean).length + (maxTuition < TUITION_MAX ? 1 : 0)

  function clearFilters() {
    setSelectedState(''); setSelectedSize(''); setSelectedType('')
    setMaxTuition(TUITION_MAX); setSelectedMajor(''); setQuery('')
  }

  const selectStyle = {
    padding: '10px 12px', borderRadius: '8px', fontSize: '13px',
    border: '1px solid var(--admyt-line)', background: 'white', color: 'var(--admyt-ink)',
    outline: 'none', cursor: 'pointer',
  }

  return (
    <div className="app-frame">
      <div className="search-hero">
        <div>
          <span className="pill teal">{loading ? 'Loading schools' : `${filtered.length} schools that could fit you`}</span>
          <h1>Browse with Sage beside you.</h1>
          <p className="match-note">Search is still fast, but every result explains why it may or may not fit you.</p>
        </div>
        <button className="btn" onClick={() => navigate('/chat')}>Ask Sage to narrow this</button>
      </div>

      <div className="search-layout">
        <input
          className="search-box"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Search by school name, city, state, major, or "NYC but warmer"'
          style={{ width: '100%', outline: 'none' }}
        />

      <div className="filters">
        <button className="pill teal">Best fit first</button>
        {(['', 'small', 'medium', 'large'] as const).map(size => (
          <button key={size || 'any-size'} onClick={() => setSelectedSize(size)} className={`pill ${selectedSize === size && size !== '' ? 'teal' : ''}`}>
            {size === '' ? 'Any size' : size.charAt(0).toUpperCase() + size.slice(1)}
          </button>
        ))}
        {(['', 'public', 'private'] as const).map(type => (
          <button key={type || 'any-type'} onClick={() => setSelectedType(type)} className={`pill ${selectedType === type && type !== '' ? 'teal' : ''}`}>
            {type === '' ? 'Any type' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        {maxTuition < TUITION_MAX && <button className="pill teal" onClick={() => setMaxTuition(TUITION_MAX)}>Under ${(maxTuition / 1000).toFixed(0)}k</button>}
        <button onClick={() => setShowMoreFilters(v => !v)} className={`pill ${showMoreFilters || !!(selectedState || selectedMajor || maxTuition < TUITION_MAX) ? 'teal' : ''}`}>
          {showMoreFilters ? 'Hide filters' : 'More filters'}
        </button>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="pill">
            Clear all
          </button>
        )}
      </div>

      {showMoreFilters && (
        <div className="mock-card section-pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
          <div>
            <label className="mini-title" style={{ display: 'block' }}>State</label>
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
              <option value="">Any state</option>
              {US_STATES.map(s => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mini-title" style={{ display: 'block' }}>Major</label>
            <select value={selectedMajor} onChange={e => setSelectedMajor(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
              <option value="">Any major</option>
              {allMajors.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mini-title" style={{ display: 'block' }}>
              Max tuition - {maxTuition < TUITION_MAX ? `$${maxTuition.toLocaleString()}/yr` : 'No limit'}
            </label>
            <input
              type="range" min={5000} max={TUITION_MAX} step={1000}
              value={maxTuition} onChange={e => setMaxTuition(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6366F1' }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="callout" style={{ textAlign: 'center' }}>
          <strong>Nothing matching those filters.</strong>
          <p>Try loosening them up. There might be a hidden gem in there.</p>
          <button onClick={clearFilters} className="btn secondary" style={{ marginTop: 14 }}>
            Clear filters and start over
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(college => (
            <CollegeCard key={college.id} college={college} profile={profile} />
          ))}
        </div>
      )}

      <div className="callout">
        <strong>From Sage</strong>
        <p>These are sorted by what Sage knows so far. The score should start the conversation, not end it.</p>
      </div>
      </div>

      <style>{`
        @keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  )
}
