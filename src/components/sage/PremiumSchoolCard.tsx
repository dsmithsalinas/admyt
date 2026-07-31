import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/context/ProfileContext'
import { useChat } from '@/context/ChatContext'
import { useSavedVibes } from '@/context/SavedVibesContext'
import { scoreCollege, hasEnoughProfileForScore, explainFit } from '@/lib/matchScore'
import { getTuitionDisplayInfo, typeLabel, type College } from '@/lib/colleges'
import { orderMajorsForProfile } from '@/lib/majors'
import HeartButton from '@/components/ui/HeartButton'

interface PremiumSchoolCardProps {
  college: College
  compact?: boolean
}

function ringColor(score: number) {
  if (score >= 80) return 'var(--admyt-teal)'
  if (score >= 60) return 'var(--admyt-indigo)'
  return 'var(--admyt-faint)'
}

export default function PremiumSchoolCard({ college, compact = false }: PremiumSchoolCardProps) {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { heartedSchools, toggleHeart } = useChat()
  const { vibeScoreFor } = useSavedVibes()
  const vibeScore = vibeScoreFor(college.id)
  const score = vibeScore ?? scoreCollege(college, profile)
  const showScore = vibeScore !== undefined || hasEnoughProfileForScore(profile)
  const isHearted = heartedSchools.has(college.id)
  const tuition = getTuitionDisplayInfo(college)
  const fitRead = explainFit(college, profile).slice(0, 2).join(' · ')
  const chips = [
    typeLabel(college.type),
    college.size.charAt(0).toUpperCase() + college.size.slice(1),
    college.acceptanceRate != null ? `${college.acceptanceRate}% admit` : null,
    tuition != null
      ? [tuition.display, tuition.label === 'out-of-state' ? tuition.label : null].filter(Boolean).join(' · ')
      : null,
  ].filter(Boolean) as string[]
  const majorChips = orderMajorsForProfile(college.majors, profile).slice(0, 2).map(major =>
    major.length > 28 ? `${major.slice(0, 27)}…` : major
  )

  return (
    <article className={`premium-school-card${compact ? ' is-compact' : ''}`}>
      <div className="premium-school-card-glow" aria-hidden="true" />

      <header className="premium-school-card-head">
        <div>
          <button
            className="premium-school-card-title"
            onClick={() => navigate(`/college/${college.id}`)}
          >
            {college.name}
          </button>
          <p>{college.location}</p>
        </div>

        <div className="premium-school-score-stack">
          {showScore ? (
            <>
              <span
                className="premium-school-score"
                style={{ color: ringColor(score), borderColor: ringColor(score) }}
              >
                <strong>{score}</strong>
                <small>match</small>
              </span>
              {vibeScore !== undefined && (
                <span className="pill vibe-refined">Refined by your Vibe Check</span>
              )}
            </>
          ) : (
            <span className="premium-school-score-pending">
              Keep talking with Sage to sharpen your match
            </span>
          )}
        </div>
      </header>

      <p className="premium-school-fit-read">{fitRead}</p>

      <div className="premium-school-facts" aria-label={`${college.name} facts`}>
        {chips.map(chip => <span key={chip}>{chip}</span>)}
        {majorChips.map(major => <span className="is-major" key={major}>{major}</span>)}
      </div>

      <footer className="premium-school-actions">
        <button className="btn secondary" onClick={() => navigate(`/college/${college.id}`)}>
          View school
        </button>
        <button className="btn premium-vibe-button" onClick={() => navigate(`/college/${college.id}/vibe`)}>
          Vibe Check
        </button>
        <HeartButton active={isHearted} onClick={() => toggleHeart(college)} size={compact ? 30 : 34} />
      </footer>
    </article>
  )
}
