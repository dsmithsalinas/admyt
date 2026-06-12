import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getCollege } from '@/lib/colleges'
import type { College } from '@/lib/colleges'
import { useProfile } from '@/context/ProfileContext'
import { useChatContext } from '@/context/ChatContext'
import { scoreCollege } from '@/lib/matchScore'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: '10px', padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
        {value}
      </div>
    </div>
  )
}

function MatchBar({ score }: { score: number }) {
  const color = score >= 85 ? '#059669' : score >= 70 ? '#6366F1' : '#94A3B8'
  const bg = score >= 85 ? '#ECFDF5' : score >= 70 ? '#EEF2FF' : '#F8FAFC'
  const border = score >= 85 ? '#A7F3D0' : score >= 70 ? '#C7D2FE' : '#E2E8F0'
  const label = score >= 85 ? 'Strong match' : score >= 70 ? 'Good match' : 'Possible match'

  return (
    <div style={{
      background: bg, border: `0.5px solid ${border}`,
      borderRadius: '12px', padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '2rem',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', color, opacity: 0.8 }}>Based on your goals and location preferences</div>
      </div>
      <div style={{ fontSize: '36px', fontWeight: 500, color }}>{score}%</div>
    </div>
  )
}

export default function CollegeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { heartedSchools, toggleHeart } = useChatContext()
  const [college, setCollege] = useState<College | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getCollege(id).then(data => {
      setCollege(data)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 0' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            height: i === 0 ? '80px' : '60px',
            borderRadius: '12px', marginBottom: '16px',
            background: 'var(--color-background-secondary)',
            animation: 'skeletonPulse 1.5s ease-in-out infinite',
          }} />
        ))}
        <style>{`@keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </div>
    )
  }

  if (!college) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎓</div>
        <div style={{ fontSize: '14px', marginBottom: '16px' }}>School not found.</div>
        <button onClick={() => navigate('/search')} style={{
          fontSize: '13px', color: '#6366F1',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          Back to search
        </button>
      </div>
    )
  }

  const score = scoreCollege(college, profile)
  const tuition = college.tuitionInState ?? college.tuitionOutState
  const isHearted = heartedSchools.has(college.id)

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 0' }}>

      {/* Back */}
      <button
        onClick={() => navigate('/search')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: 'var(--color-text-secondary)',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, marginBottom: '1.5rem',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to results
      </button>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {[
            college.type === 'public' ? 'Public' : 'Private',
            college.size.charAt(0).toUpperCase() + college.size.slice(1),
            college.state,
          ].map(tag => (
            <span key={tag} style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
              background: 'var(--color-background-secondary)',
              color: 'var(--color-text-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
            }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <h1 style={{
            fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)',
            letterSpacing: '-0.3px', marginBottom: '4px',
          }}>
            {college.name}
          </h1>
          <button
            onClick={() => toggleHeart(college)}
            style={{
              background: isHearted ? '#FDF4FF' : 'var(--color-background-secondary)',
              border: `0.5px solid ${isHearted ? '#F0ABFC' : 'var(--color-border-tertiary)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: '6px',
              color: isHearted ? '#C026D3' : 'var(--color-text-secondary)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            {isHearted ? '♥' : '♡'}
            <span style={{ fontSize: '12px', fontWeight: 500 }}>
              {isHearted ? 'Saved' : 'Save school'}
            </span>
          </button>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          {college.location}
        </div>
      </div>

      {/* Match */}
      <MatchBar score={score} />

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '10px', marginBottom: '2rem',
      }}>
        {college.acceptanceRate != null && (
          <StatCard label="Acceptance rate" value={`${college.acceptanceRate}%`} />
        )}
        {college.avgGpa != null && (
          <StatCard label="Avg GPA" value={college.avgGpa.toFixed(2)} />
        )}
        {tuition != null && (
          <StatCard label="Tuition" value={`$${tuition.toLocaleString()}`} />
        )}
        {college.avgSat != null && (
          <StatCard label="Avg SAT" value={college.avgSat.toString()} />
        )}
        {college.enrollment != null && (
          <StatCard label="Enrollment" value={college.enrollment.toLocaleString()} />
        )}
        {college.graduationRate != null && (
          <StatCard label="Grad rate" value={`${college.graduationRate}%`} />
        )}
      </div>

      {/* Description */}
      {college.description && (
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: '12px', padding: '18px', marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            About
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
            {college.description}
          </p>
        </div>
      )}

      {/* Majors */}
      {college.majors.length > 0 && (
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: '12px', padding: '18px', marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
            Popular majors
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {college.majors.map(major => (
              <span key={major} style={{
                fontSize: '13px', padding: '6px 12px', borderRadius: '20px',
                background: '#EEF2FF', color: '#4338CA', border: '0.5px solid #C7D2FE',
              }}>
                {major}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vibe Check CTA */}
      <div style={{
        background: '#0F172A', borderRadius: '12px', padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#FFFFFF', marginBottom: '4px' }}>
            ✨ Run a Vibe Check
          </div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            See if {college.name.split(' ')[0]}'s culture actually fits you
          </div>
        </div>
        <button
          onClick={() => navigate(`/college/${college!.id}/vibe`)}
          style={{
            background: '#6366F1', color: 'white', border: 'none',
            borderRadius: '8px', padding: '10px 18px', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Check the vibe
        </button>
      </div>
    </div>
  )
}
