import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

type AdmytCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  tone?: 'paper' | 'soft' | 'dark'
}

export default function AdmytCard({ children, tone = 'paper', style, ...props }: AdmytCardProps) {
  const toneStyle: Record<NonNullable<AdmytCardProps['tone']>, CSSProperties> = {
    paper: {
      background: 'rgba(255, 253, 250, 0.94)',
      border: '1px solid var(--admyt-line)',
      color: 'var(--admyt-slate)',
    },
    soft: {
      background: 'var(--admyt-grad-soft)',
      border: '1px solid rgba(232, 228, 246, 0.92)',
      color: 'var(--admyt-slate)',
    },
    dark: {
      background: 'linear-gradient(145deg, var(--admyt-plum), #171722)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: 'white',
    },
  }

  return (
    <div
      {...props}
      style={{
        borderRadius: '8px',
        boxShadow: tone === 'dark' ? '0 24px 60px rgba(42, 33, 72, 0.22)' : 'var(--admyt-shadow-small)',
        ...toneStyle[tone],
        ...style,
      }}
    >
      {children}
    </div>
  )
}
