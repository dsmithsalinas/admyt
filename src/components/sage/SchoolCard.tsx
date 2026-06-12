import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useColleges } from '@/context/CollegeContext'
import { scoreCollege } from '@/lib/matchScore'
import { useProfile } from '@/context/ProfileContext'
import { useChat } from '@/context/ChatContext'
import type { College } from '@/lib/colleges'

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? '#F0ABFC' : 'none'}>
      <path
        d="M12 21C12 21 3 14 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.54 3 23 5.46 23 8.5C23 14 14 21 12 21Z"
        stroke={filled ? '#F0ABFC' : '#94A3B8'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatTuition(n: number) {
  return `$${(n / 1000).toFixed(0)}k/yr`
}

function scoreColor(score: number) {
  if (score >= 80) return '#059669'
  if (score >= 60) return '#6366F1'
  return '#94A3B8'
}

export default function SchoolCard({ collegeId }: { collegeId: string }) {
  const { colleges } = useColleges()
  const college = colleges.find(c => c.id === collegeId) as College | undefined
  const { profile } = useProfile()
  const { heartedSchools, toggleHeart } = useChat()
  const [animating, setAnimating] = useState(false)

  if (!college) return null

  const score = scoreCollege(college, profile)
  const isHearted = heartedSchools.has(college.id)
  const color = scoreColor(score)

  function handleHeart(e: React.MouseEvent) {
    e.preventDefault()
    if (!isHearted) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 350)
    }
    toggleHeart(college!)
  }

  return (
    <div style={{
      background: 'white',
      border: '0.5px solid #E2E8F0',
      borderRadius: '14px',
      padding: '16px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
          <Link to={`/college/${college.id}`} style={{
            fontSize: '15px', fontWeight: 600, color: '#1E293B',
            textDecoration: 'none', display: 'block', marginBottom: '2px',
          }}>
            {college.name}
          </Link>
          <div style={{ fontSize: '12px', color: '#64748B' }}>{college.location}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px' }}>match</div>
          </div>
          <button
            onClick={handleHeart}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', lineHeight: 0,
              animation: animating ? 'heartPop 0.35s ease' : 'none',
            }}
            aria-label={isHearted ? 'Remove from saved' : 'Save school'}
          >
            <HeartIcon filled={isHearted} />
          </button>
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {[
          college.acceptanceRate != null ? `${college.acceptanceRate}% accepted` : null,
          (college.tuitionInState ?? college.tuitionOutState) != null
            ? formatTuition((college.tuitionInState ?? college.tuitionOutState)!)
            : null,
          college.size,
        ].filter(Boolean).map(chip => (
          <span key={chip} style={{
            fontSize: '11px', color: '#475569',
            background: '#F1F5F9', borderRadius: '100px',
            padding: '3px 9px', fontWeight: 500,
          }}>
            {chip}
          </span>
        ))}
      </div>

      {/* Top 3 majors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
        {college.majors.slice(0, 3).map(major => (
          <span key={major} style={{
            fontSize: '11px', color: '#6366F1',
            background: '#EEF2FF', borderRadius: '100px',
            padding: '3px 9px',
          }}>
            {major}
          </span>
        ))}
      </div>

      <Link to={`/college/${college.id}`} style={{
        fontSize: '12px', color: '#6366F1', fontWeight: 500,
        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
      }}>
        See full details
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  )
}
