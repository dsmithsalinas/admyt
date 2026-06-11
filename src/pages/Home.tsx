import { useState } from 'react'
import { useProfile } from '@/context/ProfileContext'
import OnboardingChat from '@/components/features/onboarding/OnboardingChat'
import type { StudentProfile } from '@/context/ProfileContext'

export default function Home() {
  const { profile, setProfile } = useProfile()
  const [showOnboarding, setShowOnboarding] = useState(false)

  function handleComplete(extracted: StudentProfile) {
    setProfile(extracted)
    setShowOnboarding(false)
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 0' }}>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '32px', fontWeight: 500,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.5px', marginBottom: '10px',
          lineHeight: 1.2,
        }}>
          find your fit.<br />
          <span style={{ color: '#6366F1' }}>feel it first.</span>
        </h1>
        <p style={{
          fontSize: '15px', color: 'var(--color-text-secondary)',
          lineHeight: 1.7,
        }}>
          AI-powered college search built for how you actually think — not just your GPA.
        </p>
      </div>

      {profile && (
        <div style={{
          background: '#EEF2FF',
          border: '0.5px solid #C7D2FE',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#3730A3', marginBottom: '6px' }}>
              Your profile
            </div>
            {profile.intendedMajor && (
              <div style={{ fontSize: '13px', color: '#4338CA', marginBottom: '3px' }}>
                Major: {profile.intendedMajor}
              </div>
            )}
            {profile.careerGoals.length > 0 && (
              <div style={{ fontSize: '13px', color: '#4338CA', marginBottom: '3px' }}>
                Goals: {profile.careerGoals.join(', ')}
              </div>
            )}
            {profile.preferredLocations.length > 0 && (
              <div style={{ fontSize: '13px', color: '#4338CA' }}>
                Location: {profile.preferredLocations.join(', ')}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            style={{
              fontSize: '12px', color: '#6366F1',
              background: 'none', border: 'none',
              cursor: 'pointer', whiteSpace: 'nowrap', padding: 0,
            }}
          >
            Edit
          </button>
        </div>
      )}

      {!profile && !showOnboarding && (
        <div style={{
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              Get personalized matches
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Tell us what you're looking for — takes 2 minutes.
            </div>
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            style={{
              background: '#6366F1', color: 'white',
              border: 'none', borderRadius: '8px',
              padding: '9px 16px', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Let's go
          </button>
        </div>
      )}

      {showOnboarding && (
        <div style={{ marginBottom: '1.5rem' }}>
          <OnboardingChat
            onComplete={handleComplete}
            onSkip={() => setShowOnboarding(false)}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { icon: '🔍', title: 'Search schools', desc: 'Browse and filter 4,000+ colleges', href: '/search', accent: false },
          { icon: '✨', title: 'Vibe Check', desc: 'See if a school fits your culture', href: '/search', accent: true },
        ].map(card => (
          <a
            key={card.title}
            href={card.href}
            style={{
              display: 'block', padding: '16px',
              borderRadius: '12px',
              border: card.accent ? '0.5px solid #C7D2FE' : '0.5px solid var(--color-border-tertiary)',
              background: card.accent ? '#EEF2FF' : 'var(--color-background-primary)',
              textDecoration: 'none',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: card.accent ? '#3730A3' : 'var(--color-text-primary)', marginBottom: '3px' }}>
              {card.title}
            </div>
            <div style={{ fontSize: '12px', color: card.accent ? '#4338CA' : 'var(--color-text-secondary)' }}>
              {card.desc}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
