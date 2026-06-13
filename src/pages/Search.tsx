import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useColleges } from '@/context/CollegeContext'
import { useProfile } from '@/context/ProfileContext'
import { useChatContext } from '@/context/ChatContext'
import { scoreCollege } from '@/lib/matchScore'
import type { College } from '@/lib/colleges'
import ScoreRing from '@/components/ui/ScoreRing'
import HeartButton from '@/components/ui/HeartButton'

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

function ringColor(score: number) {
  if (score >= 80) return '#6366F1'
  if (score >= 60) return '#8B5CF6'
  return '#A8A8BC'
}

function CollegeCard({ college, profile }: { college: College; profile: ReturnType<typeof useProfile>['profile'] }) {
  const score = scoreCollege(college, profile)
  const navigate = useNavigate()
  const { heartedSchools, toggleHeart } = useChatContext()
  const isHearted = heartedSchools.has(college.id)
  const tuition = college.tuitionInState ?? college.tuitionOutState
  const typeLabel = college.type === 'public' ? 'Public' : 'Private'
  const sizeLabel = college.size.charAt(0).toUpperCase() + college.size.slice(1)

  const chips = [
    typeLabel, sizeLabel,
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
      style={{
        background: 'white', border: '1px solid #EEECFB', borderRadius: '18px',
        padding: '14px', boxShadow: '0 3px 16px rgba(99,102,241,0.06)',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: '10px',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#C7C4F6')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#EEECFB')}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#15151C', marginBottom: '2px' }}>{college.name}</div>
          <div style={{ fontSize: '11px', color: '#A8A8BC' }}>{college.location}</div>
        </div>
        <ScoreRing score={score} size={46} color={ringColor(score)} />
      </div>

      {college.description && (
        <p style={{ fontSize: '12px', color: '#8B8B9E', lineHeight: 1.55, margin: 0 }}>
          {college.description.length > 100 ? college.description.slice(0, 100) + '…' : college.description}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {chips.map(tag => (
          <span key={tag} style={{ fontSize: '10.5px', fontWeight: 500, color: '#6366F1', background: '#F4F3FE', borderRadius: '20px', padding: '3px 9px' }}>
            {tag}
          </span>
        ))}
      </div>

      {majorChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {majorChips.map(major => (
            <span key={major} style={{ fontSize: '10.5px', fontWeight: 500, color: '#8B5CF6', background: '#F4F3FE', borderRadius: '20px', padding: '3px 9px' }}>
              {major}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          onClick={e => { e.stopPropagation(); navigate(`/college/${college.id}/vibe`) }}
          style={{ fontSize: '11.5px', fontWeight: 500, color: '#8B5CF6', cursor: 'pointer' }}
        >
          ✨ Check the vibe
        </span>
        <HeartButton active={isHearted} onClick={e => { e.stopPropagation(); toggleHeart(college) }} size={30} />
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ height: '180px', borderRadius: '18px', background: '#F4F3FE', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
  )
}

export default function Search() {
  const { profile } = useProfile()
  const { colleges, loading } = useColleges()
  const [query, setQuery] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [maxTuition, setMaxTuition] = useState(70000)
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
        if (tuition != null && tuition > maxTuition) return false
        if (selectedMajor && !c.majors.includes(selectedMajor)) return false
        return true
      })
      .sort((a, b) => scoreCollege(b, profile) - scoreCollege(a, profile))
  }, [colleges, query, selectedState, selectedSize, selectedType, maxTuition, selectedMajor, profile])

  const activeFilters = [selectedState, selectedSize, selectedType, selectedMajor].filter(Boolean).length + (maxTuition < 70000 ? 1 : 0)

  function clearFilters() {
    setSelectedState(''); setSelectedSize(''); setSelectedType('')
    setMaxTuition(70000); setSelectedMajor(''); setQuery('')
  }

  function pillStyle(active: boolean) {
    return {
      fontSize: '12px', padding: '7px 13px', borderRadius: '20px', border: 'none',
      cursor: 'pointer', fontWeight: active ? 500 : 400,
      background: active ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#F4F3FE',
      color: active ? '#fff' : '#6366F1',
      transition: 'all 0.15s', whiteSpace: 'nowrap' as const,
    }
  }

  const selectStyle = {
    padding: '8px 10px', borderRadius: '8px', fontSize: '13px',
    border: '1px solid #EEECFB', background: 'white', color: '#15151C',
    outline: 'none', cursor: 'pointer',
  }

  return (
    <div>
      {/* Search bar */}
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A8A8BC' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by school name, city, or state..."
          style={{
            width: '100%', boxSizing: 'border-box',
            paddingLeft: '40px', paddingRight: '16px', paddingTop: '11px', paddingBottom: '11px',
            borderRadius: '22px', border: '1px solid #ECEAFB', background: 'white',
            fontSize: '14px', color: '#15151C', outline: 'none',
            boxShadow: '0 4px 20px rgba(99,102,241,0.06)',
          }}
        />
      </div>

      {/* Filter pills row */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '16px', alignItems: 'center' }}>
        {/* Size pills */}
        {(['', 'small', 'medium', 'large'] as const).map(size => (
          <button key={size || 'any-size'} onClick={() => setSelectedSize(size)} style={pillStyle(selectedSize === size && size !== '')}>
            {size === '' ? 'Any size' : size.charAt(0).toUpperCase() + size.slice(1)}
          </button>
        ))}
        <div style={{ width: '1px', height: '20px', background: '#EEECFB', flexShrink: 0 }} />
        {/* Type pills */}
        {(['', 'public', 'private'] as const).map(type => (
          <button key={type || 'any-type'} onClick={() => setSelectedType(type)} style={pillStyle(selectedType === type && type !== '')}>
            {type === '' ? 'Any type' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <div style={{ width: '1px', height: '20px', background: '#EEECFB', flexShrink: 0 }} />
        {/* More filters toggle */}
        <button onClick={() => setShowMoreFilters(v => !v)} style={pillStyle(showMoreFilters || !!(selectedState || selectedMajor || maxTuition < 70000))}>
          {showMoreFilters ? 'Hide filters' : `More filters${selectedState || selectedMajor || maxTuition < 70000 ? ' •' : ''}`}
        </button>
        {activeFilters > 0 && (
          <button onClick={clearFilters} style={{ fontSize: '12px', color: '#8B8B9E', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', padding: '7px 4px' }}>
            Clear all
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showMoreFilters && (
        <div style={{
          background: 'white', border: '1px solid #EEECFB', borderRadius: '16px',
          padding: '16px', marginBottom: '16px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px',
        }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#A8A8BC', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>State</label>
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
              <option value="">Any state</option>
              {US_STATES.map(s => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#A8A8BC', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Major</label>
            <select value={selectedMajor} onChange={e => setSelectedMajor(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
              <option value="">Any major</option>
              {allMajors.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#A8A8BC', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              Max tuition — ${maxTuition.toLocaleString()}/yr
            </label>
            <input
              type="range" min={5000} max={70000} step={1000}
              value={maxTuition} onChange={e => setMaxTuition(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6366F1' }}
            />
          </div>
        </div>
      )}

      {/* Results count */}
      <div style={{ fontSize: '11px', color: '#A8A8BC', marginBottom: '14px' }}>
        {loading ? '...' : `${filtered.length} schools match your vibe`}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8B8B9E' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
          <div style={{ fontSize: '14px', marginBottom: '4px', color: '#3A3A4D' }}>Nothing matching those filters.</div>
          <div style={{ fontSize: '13px', color: '#8B8B9E', marginBottom: '16px' }}>Try loosening them up — there might be a hidden gem in there.</div>
          <button onClick={clearFilters} style={{ fontSize: '13px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Clear filters and start over
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtered.map(college => (
            <CollegeCard key={college.id} college={college} profile={profile} />
          ))}
        </div>
      )}

      <style>{`@keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}
