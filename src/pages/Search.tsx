import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useColleges } from '@/context/CollegeContext'
import { useProfile } from '@/context/ProfileContext'
import { scoreCollege } from '@/lib/matchScore'
import type { College } from '@/lib/colleges'

const US_STATES = [
  { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AL', name: 'Alabama' },
  { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'CA', name: 'California' },
  { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },
  { abbr: 'DC', name: 'Washington D.C.' },
  { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'IA', name: 'Iowa' },
  { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },
  { abbr: 'IN', name: 'Indiana' },
  { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MD', name: 'Maryland' },
  { abbr: 'ME', name: 'Maine' },
  { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MO', name: 'Missouri' },
  { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MT', name: 'Montana' },
  { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' },
  { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NH', name: 'New Hampshire' },
  { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' },
  { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NY', name: 'New York' },
  { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },
  { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },
  { abbr: 'UT', name: 'Utah' },
  { abbr: 'VA', name: 'Virginia' },
  { abbr: 'VT', name: 'Vermont' },
  { abbr: 'WA', name: 'Washington' },
  { abbr: 'WI', name: 'Wisconsin' },
  { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WY', name: 'Wyoming' },
]

function MatchBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#059669' : score >= 70 ? '#6366F1' : '#94A3B8'
  const bg = score >= 85 ? '#ECFDF5' : score >= 70 ? '#EEF2FF' : '#F8FAFC'
  const border = score >= 85 ? '#A7F3D0' : score >= 70 ? '#C7D2FE' : '#E2E8F0'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: bg, border: `0.5px solid ${border}`,
      borderRadius: '20px', padding: '3px 10px',
      fontSize: '12px', fontWeight: 500, color,
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1L6.18 3.4L9 3.76L7 5.7L7.47 8.5L5 7.24L2.53 8.5L3 5.7L1 3.76L3.82 3.4L5 1Z"
          fill={color} />
      </svg>
      {score}% match
    </div>
  )
}

function CollegeCard({ college, profile }: { college: College; profile: ReturnType<typeof useProfile>['profile'] }) {
  const score = scoreCollege(college, profile)
  const navigate = useNavigate()
  const tuition = college.tuitionInState ?? college.tuitionOutState
  const typeLabel = college.type === 'public' ? 'Public' : 'Private'
  const sizeLabel = college.size.charAt(0).toUpperCase() + college.size.slice(1)

  return (
    <div
      onClick={() => navigate(`/college/${college.id}`)}
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '12px',
        padding: '18px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        transition: 'border-color 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-secondary)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-tertiary)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
            {college.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {college.location}
          </div>
        </div>
        <MatchBadge score={score} />
      </div>

      {college.description && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {college.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {[
          typeLabel,
          sizeLabel,
          college.acceptanceRate != null ? `${college.acceptanceRate}% admit rate` : null,
          tuition != null ? `$${tuition.toLocaleString()}/yr` : null,
        ].filter(Boolean).map(tag => (
          <span key={tag!} style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
            background: 'var(--color-background-secondary)',
            color: 'var(--color-text-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
          }}>
            {tag}
          </span>
        ))}
      </div>

      {college.majors.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {college.majors.slice(0, 3).map(major => (
            <span key={major} style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
              background: '#EEF2FF', color: '#4338CA', border: '0.5px solid #C7D2FE',
            }}>
              {major}
            </span>
          ))}
          {college.majors.length > 3 && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '2px 4px' }}>
              +{college.majors.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      height: '180px', borderRadius: '12px',
      background: 'var(--color-background-secondary)',
      animation: 'skeletonPulse 1.5s ease-in-out infinite',
    }} />
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

  const allMajors = useMemo(
    () => Array.from(new Set(colleges.flatMap(c => c.majors))).sort(),
    [colleges],
  )

  const filtered = useMemo(() => {
    return colleges
      .filter(c => {
        if (query && !c.name.toLowerCase().includes(query.toLowerCase()) &&
          !c.location.toLowerCase().includes(query.toLowerCase())) return false
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

  const activeFilters = [selectedState, selectedSize, selectedType, selectedMajor]
    .filter(Boolean).length + (maxTuition < 70000 ? 1 : 0)

  function clearFilters() {
    setSelectedState('')
    setSelectedSize('')
    setSelectedType('')
    setMaxTuition(70000)
    setSelectedMajor('')
    setQuery('')
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: 500 as const,
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }

  const selectStyle = {
    width: '100%', padding: '8px 10px',
    borderRadius: '8px', fontSize: '13px',
    border: '0.5px solid var(--color-border-secondary)',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    outline: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

      {/* Filters sidebar */}
      <div style={{
        width: '220px', flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: '20px',
        position: 'sticky', top: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Filters</span>
          {activeFilters > 0 && (
            <button onClick={clearFilters} style={{
              fontSize: '12px', color: '#6366F1',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              Clear {activeFilters}
            </button>
          )}
        </div>

        <div>
          <label style={labelStyle}>State</label>
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={selectStyle}>
            <option value="">Any state</option>
            {US_STATES.map(s => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Size</label>
          <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)} style={selectStyle}>
            <option value="">Any size</option>
            <option value="small">Small (&lt;5k students)</option>
            <option value="medium">Medium (5k–15k)</option>
            <option value="large">Large (15k+)</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Type</label>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={selectStyle}>
            <option value="">Public or private</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Max tuition — ${maxTuition.toLocaleString()}/yr</label>
          <input
            type="range" min={5000} max={70000} step={1000}
            value={maxTuition} onChange={e => setMaxTuition(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#6366F1' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            <span>$5k</span><span>$70k</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Major</label>
          <select value={selectedMajor} onChange={e => setSelectedMajor(e.target.value)} style={selectStyle}>
            <option value="">Any major</option>
            {allMajors.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by school name or city..."
            style={{
              flex: 1, padding: '10px 14px',
              borderRadius: '8px', fontSize: '14px',
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)', outline: 'none',
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
            {loading ? '...' : `${filtered.length} school${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎓</div>
            <div style={{ fontSize: '14px' }}>No schools match those filters.</div>
            <button onClick={clearFilters} style={{
              marginTop: '12px', fontSize: '13px', color: '#6366F1',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {filtered.map(college => (
              <CollegeCard key={college.id} college={college} profile={profile} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
