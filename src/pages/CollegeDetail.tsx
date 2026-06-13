import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getCollege, getShortName, clearCollegeCache } from '@/lib/colleges'
import type { College } from '@/lib/colleges'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/context/ProfileContext'
import { useChatContext } from '@/context/ChatContext'
import { scoreCollege } from '@/lib/matchScore'
import ScoreRing from '@/components/ui/ScoreRing'
import HeartButton from '@/components/ui/HeartButton'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #EEECFB', borderRadius: '14px', padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 3px 16px rgba(99,102,241,0.06)',
    }}>
      <div style={{ fontSize: '11px', color: '#A8A8BC', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 500, color: '#15151C' }}>{value}</div>
    </div>
  )
}

function ringColor(score: number) {
  if (score >= 80) return '#6366F1'
  if (score >= 60) return '#8B5CF6'
  return '#A8A8BC'
}

function matchLabel(score: number) {
  if (score >= 85) return 'Looks like a strong fit'
  if (score >= 70) return 'Decent fit for you'
  return 'Might be worth a look'
}

export default function CollegeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { heartedSchools, toggleHeart } = useChatContext()
  const [college, setCollege] = useState<College | null>(null)
  const [loading, setLoading] = useState(true)
  const [descriptionLoading, setDescriptionLoading] = useState(false)
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setGeneratedDescription(null)
    getCollege(id).then(data => { setCollege(data); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!college) return
    if (college.description) return

    async function generateDescription() {
      if (!college) return
      setDescriptionLoading(true)
      try {
        const prompt = `Write a 2-3 sentence description of ${college.name} in an honest, warm, direct voice — like a knowledgeable older sibling giving real talk, not a brochure. Be specific to this school. Base it only on these facts: located in ${college.location}, ${college.type} institution, ${college.size} size, ${college.acceptanceRate ? college.acceptanceRate + '% acceptance rate' : 'acceptance rate unknown'}, top majors include ${college.majors.slice(0, 5).join(', ')}. No hype, no generic phrases like "vibrant campus community." Just honest, specific, useful.`

        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: prompt }],
              system: 'You write honest, specific, warm college descriptions in 2-3 sentences. No marketing speak. No generic phrases. Real talk only.',
              max_tokens: 150,
            }),
          }
        )

        const data = await resp.json()
        const description = data?.content?.[0]?.text?.trim()

        if (description) {
          setGeneratedDescription(description)
          await supabase
            .from('colleges')
            .update({ description })
            .eq('id', college.id)
          clearCollegeCache()
        }
      } catch (err) {
        console.error('Failed to generate description:', err)
      } finally {
        setDescriptionLoading(false)
      }
    }

    generateDescription()
  }, [college])

  if (loading) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 0' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: i === 0 ? '80px' : '60px', borderRadius: '18px', marginBottom: '16px', background: '#F4F3FE', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        ))}
        <style>{`@keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </div>
    )
  }

  if (!college) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#8B8B9E' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎓</div>
        <div style={{ fontSize: '14px', marginBottom: '16px' }}>School not found.</div>
        <button onClick={() => navigate('/search')} style={{ fontSize: '13px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
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
          fontSize: '13px', color: '#8B8B9E', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, marginBottom: '1.5rem',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to results
      </button>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {[college.type === 'public' ? 'Public' : 'Private', college.size.charAt(0).toUpperCase() + college.size.slice(1), college.state].map(tag => (
            <span key={tag} style={{ fontSize: '11.5px', fontWeight: 500, color: '#6366F1', background: '#F4F3FE', borderRadius: '20px', padding: '4px 10px' }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 500, color: '#15151C', letterSpacing: '-0.3px', marginBottom: '4px' }}>
              {college.name}
            </h1>
            <div style={{ fontSize: '14px', color: '#8B8B9E' }}>{college.location}</div>
          </div>
          <HeartButton
            active={isHearted}
            onClick={() => toggleHeart(college)}
            size={38}
          />
        </div>
      </div>

      {/* Match card */}
      <div style={{
        background: 'linear-gradient(135deg, #F4F3FE, #FCE7F3)', borderRadius: '18px',
        padding: '18px 20px', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <ScoreRing score={score} size={56} color={ringColor(score)} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: ringColor(score), marginBottom: '3px' }}>
            {matchLabel(score)} — {score}%
          </div>
          <div style={{ fontSize: '12px', color: '#7C6FB0', lineHeight: 1.5 }}>
            Based on what you've told Sage so far
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '2rem' }}>
        {college.acceptanceRate != null && <StatCard label="Acceptance rate" value={`${college.acceptanceRate}%`} />}
        {college.avgGpa != null && <StatCard label="Avg GPA" value={college.avgGpa.toFixed(2)} />}
        {tuition != null && <StatCard label="Tuition" value={`$${tuition.toLocaleString()}`} />}
        {college.avgSat != null && <StatCard label="Avg SAT" value={college.avgSat.toString()} />}
        {college.enrollment != null && <StatCard label="Enrollment" value={college.enrollment.toLocaleString()} />}
        {college.graduationRate != null && <StatCard label="Grad rate" value={`${college.graduationRate}%`} />}
      </div>

      {/* Description */}
      {(college.description || generatedDescription || descriptionLoading) && (
        <div style={{ background: 'white', border: '1px solid #EEECFB', borderRadius: '16px', padding: '18px', marginBottom: '1.5rem', boxShadow: '0 3px 16px rgba(99,102,241,0.06)' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#A8A8BC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>About</div>
          {descriptionLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[100, 85, 60].map(w => (
                <div key={w} style={{ height: '14px', width: `${w}%`, borderRadius: '6px', background: '#F4F3FE', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: '#3A3A4D', lineHeight: 1.7, margin: 0 }}>{college.description ?? generatedDescription}</p>
          )}
        </div>
      )}

      {/* Majors */}
      {college.majors.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #EEECFB', borderRadius: '16px', padding: '18px', marginBottom: '1.5rem', boxShadow: '0 3px 16px rgba(99,102,241,0.06)' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#A8A8BC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Popular majors</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {college.majors.map(major => (
              <span key={major} style={{ fontSize: '12px', fontWeight: 500, color: '#8B5CF6', background: '#F4F3FE', borderRadius: '20px', padding: '5px 12px' }}>
                {major}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vibe Check CTA */}
      <div style={{
        background: 'linear-gradient(150deg, #6366F1, #8B5CF6 60%, #EC4899)',
        borderRadius: '18px', padding: '22px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#FFFFFF', marginBottom: '5px' }}>
            ✨ Vibe Check
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
            Does {getShortName(college.name)}'s culture actually fit you? Let's find out.
          </div>
        </div>
        <button
          onClick={() => navigate(`/college/${college!.id}/vibe`)}
          style={{
            flexShrink: 0, background: 'rgba(255,255,255,0.22)', color: 'white',
            border: '1px solid rgba(255,255,255,0.35)', borderRadius: '12px',
            padding: '10px 18px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          Check the vibe
        </button>
      </div>
    </div>
  )
}
