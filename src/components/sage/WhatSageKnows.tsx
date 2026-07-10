import { useState } from 'react'
import { useProfile } from '@/context/ProfileContext'
import AdmytCard from '@/components/ui/AdmytCard'
import SageOrb from './SageOrb'

function KnownRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '11px', color: 'var(--admyt-muted)', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: '12px', color: 'var(--admyt-ink)', textAlign: 'right', lineHeight: 1.45 }}>
        {value || 'Still fuzzy'}
      </span>
    </div>
  )
}

function humanizePreferredSize(size?: 'small' | 'medium' | 'large' | null): string | undefined {
  if (!size) return undefined
  return {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
  }[size]
}

function humanizePreferredInstitutionType(type?: 'two_year' | 'four_year' | 'either' | null): string | undefined {
  if (!type) return undefined
  return {
    two_year: 'Two-year',
    four_year: 'Four-year',
    either: 'Open to either',
  }[type]
}

export default function WhatSageKnows({ compact = false }: { compact?: boolean }) {
  const { profile } = useProfile()
  const [open, setOpen] = useState(!compact)
  const rows = [
    { label: 'Location', value: profile?.preferredLocations?.join(', ') },
    { label: 'Major', value: profile?.intendedMajor },
    { label: 'Goals', value: profile?.careerGoals?.join(', ') },
    { label: 'Size', value: humanizePreferredSize(profile?.preferredSize) },
    { label: 'Type', value: humanizePreferredInstitutionType(profile?.preferredInstitutionType) },
  ]
  const knownCount = rows.filter(row => row.value).length

  return (
    <AdmytCard tone="soft" style={{ padding: compact ? '12px' : '16px', boxShadow: compact ? 'none' : 'var(--admyt-shadow-small)' }}>
      <button
        type="button"
        onClick={() => compact && setOpen(v => !v)}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: compact ? 'pointer' : 'default',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SageOrb size={32} />
          <span>
            <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--admyt-ink)' }}>
              What Sage knows
            </span>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--admyt-muted)', marginTop: '2px' }}>
              {knownCount ? `Sage knows ${knownCount} thing${knownCount === 1 ? '' : 's'} about you` : 'Start talking and this fills in'}
            </span>
          </span>
        </span>
        {compact && <span style={{ color: 'var(--admyt-indigo)', fontSize: '18px' }}>{open ? '-' : '+'}</span>}
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
          {rows.map(row => <KnownRow key={row.label} label={row.label} value={row.value} />)}
          <div style={{ borderTop: '1px solid rgba(232,228,246,0.8)', paddingTop: '10px', fontSize: '12px', color: 'var(--admyt-muted)', lineHeight: 1.5 }}>
            Keep chatting and Sage will sharpen the list around your real preferences.
          </div>
        </div>
      )}
    </AdmytCard>
  )
}
