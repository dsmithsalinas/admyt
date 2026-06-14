import type { HTMLAttributes, ReactNode } from 'react'

export default function AdmytPill({ children, style, ...props }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span
      {...props}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        borderRadius: '999px',
        background: 'var(--admyt-lavender)',
        border: '1px solid var(--admyt-line)',
        color: 'var(--admyt-indigo)',
        fontSize: '11px',
        fontWeight: 700,
        padding: '4px 10px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
