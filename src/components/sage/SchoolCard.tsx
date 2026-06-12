import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useColleges } from '@/context/CollegeContext'
import { scoreCollege } from '@/lib/matchScore'
import { useProfile } from '@/context/ProfileContext'
import { useChat } from '@/context/ChatContext'
import type { College } from '@/lib/colleges'
import ScoreRing from '@/components/ui/ScoreRing'
import HeartButton from '@/components/ui/HeartButton'

function formatTuition(n: number) {
  return `$${(n / 1000).toFixed(0)}k/yr`
}

function ringColor(score: number) {
  if (score >= 80) return '#6366F1'
  if (score >= 60) return '#8B5CF6'
  return '#A8A8BC'
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

  function handleHeart(e: React.MouseEvent) {
    e.preventDefault()
    if (!isHearted) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 350)
    }
    toggleHeart(college!)
  }

  const chips = [
    college.acceptanceRate != null ? `${college.acceptanceRate}% accepted` : null,
    (college.tuitionInState ?? college.tuitionOutState) != null
      ? formatTuition((college.tuitionInState ?? college.tuitionOutState)!)
      : null,
    college.size,
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
    <div style={{
      background: 'white',
      border: '1px solid #EEECFB',
      borderRadius: '18px',
      padding: '14px',
      boxShadow: '0 3px 16px rgba(99,102,241,0.06)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      animation: animating ? 'heartPop 0.35s ease' : 'none',
    }}>
      {/* Gradient top edge */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/college/${college.id}`} style={{
            fontSize: '14px', fontWeight: 500, color: '#15151C',
            textDecoration: 'none', display: 'block', marginBottom: '2px',
          }}>
            {college.name}
          </Link>
          <div style={{ fontSize: '11px', color: '#A8A8BC' }}>{college.location}</div>
        </div>
        <ScoreRing score={score} size={46} color={ringColor(score)} />
      </div>

      {/* Chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
          {chips.map(chip => (
            <span key={chip} style={{
              fontSize: '10.5px', fontWeight: 500, color: '#6366F1',
              background: '#F4F3FE', borderRadius: '20px',
              padding: '3px 9px',
            }}>
              {chip}
            </span>
          ))}
          {majorChips.map(major => (
            <span key={major} style={{
              fontSize: '10.5px', fontWeight: 500, color: '#8B5CF6',
              background: '#F4F3FE', borderRadius: '20px',
              padding: '3px 9px',
            }}>
              {major}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to={`/college/${college.id}`} style={{
          fontSize: '12px', color: '#6366F1', fontWeight: 500,
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
          See full details →
        </Link>
        <HeartButton active={isHearted} onClick={handleHeart} size={30} />
      </div>
    </div>
  )
}
