import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { sampleColleges } from '@/data/sampleColleges'
import { useProfile } from '@/context/ProfileContext'

interface VibeDimension {
  key: string
  label: string
  emoji: string
  score: number
  summary: string
}

interface VibeResult {
  dimensions: VibeDimension[]
  overallSummary: string
  fitScore: number
}

const VIBE_DIMENSIONS = [
  { key: 'social', label: 'Social scene', emoji: '🎉' },
  { key: 'athletics', label: 'Athletics & school spirit', emoji: '🏈' },
  { key: 'arts', label: 'Arts, music & creativity', emoji: '🎨' },
  { key: 'political', label: 'Political & activist culture', emoji: '✊' },
  { key: 'greekLife', label: 'Greek life', emoji: '🏛️' },
  { key: 'diversity', label: 'Diversity & inclusion', emoji: '🌍' },
  { key: 'outdoor', label: 'Outdoor & nature access', emoji: '🏔️' },
  { key: 'academic', label: 'Academic intensity', emoji: '📚' },
  { key: 'community', label: 'Local community atmosphere', emoji: '🏘️' },
]

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{
      height: '6px',
      background: 'var(--color-background-secondary)',
      borderRadius: '3px',
      overflow: 'hidden',
      marginTop: '6px',
    }}>
      <div style={{
        height: '100%',
        width: `${score * 10}%`,
        background: color,
        borderRadius: '3px',
        transition: 'width 0.6s ease',
      }} />
    </div>
  )
}

function DimensionCard({ dim, color }: { dim: VibeDimension; color: string }) {
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: '12px',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{dim.emoji}</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {dim.label}
          </span>
        </div>
        <span style={{ fontSize: '15px', fontWeight: 500, color }}>{dim.score}/10</span>
      </div>
      <ScoreBar score={dim.score} color={color} />
      <p style={{
        fontSize: '12px', color: 'var(--color-text-secondary)',
        lineHeight: 1.6, margin: '8px 0 0',
      }}>
        {dim.summary}
      </p>
    </div>
  )
}

export default function VibeCheck() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [result, setResult] = useState<VibeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const college = sampleColleges.find(c => c.id === id)

  if (!college) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          School not found.
        </div>
        <button onClick={() => navigate('/search')} style={{
          fontSize: '13px', color: '#6366F1',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          Back to search
        </button>
      </div>
    )
  }

  const accentColor = '#6366F1'

  async function runVibeCheck() {
    setLoading(true)
    setError(null)

    const systemPrompt = `You are Admyt's Vibe Check feature. You analyze the social scene, campus culture, and student life at a college and return a structured JSON vibe analysis.

You must respond with ONLY valid JSON — no preamble, no explanation, no markdown. The JSON must match this exact structure:
{
  "dimensions": [
    { "key": "social", "label": "Social scene", "emoji": "🎉", "score": 7, "summary": "One sentence about this dimension at this school." },
    { "key": "athletics", "label": "Athletics & school spirit", "emoji": "🏈", "score": 8, "summary": "..." },
    { "key": "arts", "label": "Arts, music & creativity", "emoji": "🎨", "score": 6, "summary": "..." },
    { "key": "political", "label": "Political & activist culture", "emoji": "✊", "score": 7, "summary": "..." },
    { "key": "greekLife", "label": "Greek life", "emoji": "🏛️", "score": 5, "summary": "..." },
    { "key": "diversity", "label": "Diversity & inclusion", "emoji": "🌍", "score": 8, "summary": "..." },
    { "key": "outdoor", "label": "Outdoor & nature access", "emoji": "🏔️", "score": 4, "summary": "..." },
    { "key": "academic", "label": "Academic intensity", "emoji": "📚", "score": 9, "summary": "..." },
    { "key": "community", "label": "Local community atmosphere", "emoji": "🏘️", "score": 6, "summary": "..." }
  ],
  "overallSummary": "2-3 sentence summary of the overall vibe of this school and whether it fits this student.",
  "fitScore": 75
}

Scores are 1-10. fitScore is 1-100. Be honest, specific, and avoid generic talking points. Base your analysis on real knowledge of the school.`

    const userMessage = `College: ${college.name} in ${college.location}
Student interests: ${profile?.careerGoals?.join(', ') || 'not specified'}
Student location preference: ${profile?.preferredLocations?.join(', ') || 'not specified'}
Intended major: ${profile?.intendedMajor || 'not specified'}

Please generate a vibe check for this student at this school.`

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      const data = await response.json()
      const text = data.content?.[0]?.text ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed: VibeResult = JSON.parse(clean)
      setResult(parsed)
    } catch (err) {
      setError('Something went wrong. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fitColor = result
    ? result.fitScore >= 80 ? '#059669'
    : result.fitScore >= 60 ? '#6366F1'
    : '#94A3B8'
    : accentColor

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 0' }}>

      {/* Back button */}
      <button
        onClick={() => navigate(`/college/${id}`)}
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
        Back to {college.name.split(' ')[0]}
      </button>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#EEF2FF', border: '0.5px solid #C7D2FE',
          borderRadius: '20px', padding: '3px 10px',
          fontSize: '12px', fontWeight: 500, color: '#4338CA',
          marginBottom: '10px',
        }}>
          ✨ Vibe Check
        </div>
        <h1 style={{
          fontSize: '24px', fontWeight: 500,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.3px', marginBottom: '4px',
        }}>
          {college.name}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Does this school's culture actually fit you?
        </p>
      </div>

      {/* Pre-run state */}
      {!result && !loading && (
        <div style={{
          background: '#0F172A',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✨</div>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#FFFFFF', marginBottom: '8px' }}>
            Ready to check the vibe?
          </div>
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', lineHeight: 1.6 }}>
            We'll analyze {college.name}'s social scene, culture, and campus life across 9 dimensions and match it to your profile.
          </div>
          <button
            onClick={runVibeCheck}
            style={{
              background: '#6366F1', color: 'white',
              border: 'none', borderRadius: '10px',
              padding: '12px 28px', fontSize: '14px',
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            Run Vibe Check
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          background: '#0F172A',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
            Analyzing {college.name}'s vibe...
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#6366F1',
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          background: '#FEF2F2', border: '0.5px solid #FECACA',
          borderRadius: '10px', padding: '14px 16px',
          fontSize: '13px', color: '#DC2626',
          marginBottom: '1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {error}
          <button onClick={runVibeCheck} style={{
            fontSize: '12px', color: '#DC2626',
            background: 'none', border: 'none', cursor: 'pointer',
          }}>
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Fit score hero */}
          <div style={{
            background: '#0F172A',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overall vibe fit
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, maxWidth: '380px' }}>
                {result.overallSummary}
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '48px', fontWeight: 500, color: fitColor, lineHeight: 1 }}>
                {result.fitScore}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>/ 100</div>
            </div>
          </div>

          {/* Dimension cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
            {result.dimensions.map(dim => (
              <DimensionCard key={dim.key} dim={dim} color={accentColor} />
            ))}
          </div>

          {/* Re-run button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={runVibeCheck}
              style={{
                fontSize: '13px', color: 'var(--color-text-secondary)',
                background: 'none',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '8px',
                padding: '8px 16px', cursor: 'pointer',
              }}
            >
              Re-run analysis
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
