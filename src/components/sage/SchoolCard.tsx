import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useColleges } from '@/context/CollegeContext'
import { scoreCollege, hasEnoughProfileForScore, explainFit } from '@/lib/matchScore'
import { useProfile } from '@/context/ProfileContext'
import { useChat } from '@/context/ChatContext'
import { useSavedVibes } from '@/context/SavedVibesContext'
import { getTuitionDisplayInfo, type College } from '@/lib/colleges'
import { orderMajorsForProfile } from '@/lib/majors'
import ScoreRing from '@/components/ui/ScoreRing'
import HeartButton from '@/components/ui/HeartButton'
import AdmytPill from '@/components/ui/AdmytPill'
import AdmytButton from '@/components/ui/AdmytButton'

function ringColor(score: number) {
  if (score >= 80) return 'var(--admyt-teal)'
  if (score >= 60) return 'var(--admyt-indigo)'
  return 'var(--admyt-faint)'
}

function fitLine(college: College, profile: ReturnType<typeof useProfile>['profile']) {
  return explainFit(college, profile).slice(0, 2).join(' · ')
}

export default function SchoolCard({ collegeId }: { collegeId: string }) {
  const { colleges } = useColleges()
  const college = colleges.find(c => c.id === collegeId) as College | undefined
  const { profile } = useProfile()
  const { heartedSchools, toggleHeart } = useChat()
  const { vibeScoreFor } = useSavedVibes()
  const [animating, setAnimating] = useState(false)

  if (!college) return null

  const vibeScore = vibeScoreFor(college.id)
  const score = vibeScore ?? scoreCollege(college, profile)
  const showScore = vibeScore !== undefined || hasEnoughProfileForScore(profile)
  const isHearted = heartedSchools.has(college.id)
  const fitRead = fitLine(college, profile)
  const tuition = getTuitionDisplayInfo(college)

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
    tuition != null ? [tuition.display, tuition.label === 'out-of-state' ? tuition.label : null].filter(Boolean).join(' · ') : null,
    college.size,
  ].filter(Boolean) as string[]

  const majorChips = orderMajorsForProfile(college.majors, profile).slice(0, 2).map(m =>
    m.length > 28 ? m.slice(0, 27) + '…' : m
  )

  return (
    <div style={{
      background: 'rgba(255,253,250,0.96)',
      border: '1px solid var(--admyt-line)',
      borderRadius: '12px',
      padding: '15px',
      boxShadow: 'var(--admyt-shadow-small)',
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
        background: 'var(--admyt-grad)',
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
          <div style={{ fontSize: '11px', color: 'var(--admyt-muted)' }}>{college.location}</div>
        </div>
        <div className="score-stack">
          {showScore ? (
            <>
              <ScoreRing score={score} size={46} color={ringColor(score)} />
              <span className="score-label">Fit Score</span>
              {vibeScore !== undefined && <span className="pill vibe-refined">Refined by your Vibe Check</span>}
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

      <p style={{ fontSize: '12px', color: 'var(--admyt-slate)', lineHeight: 1.55, margin: '0 0 10px' }}>
        {fitRead}
      </p>

      {/* Chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
          {chips.map(chip => (
            <AdmytPill key={chip}>{chip}</AdmytPill>
          ))}
          {majorChips.map(major => (
            <AdmytPill key={major} style={{ color: 'var(--admyt-violet)' }}>{major}</AdmytPill>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to={`/college/${college.id}`} style={{ textDecoration: 'none' }}>
            <AdmytButton variant="secondary" style={{ padding: '8px 12px', fontSize: '12px' }}>View school</AdmytButton>
          </Link>
          <Link to={`/college/${college.id}/vibe`} style={{ textDecoration: 'none' }}>
            <AdmytButton variant="secondary" style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--admyt-pink)' }}>Vibe Check</AdmytButton>
          </Link>
        </div>
        <HeartButton active={isHearted} onClick={handleHeart} size={32} />
      </div>
    </div>
  )
}
