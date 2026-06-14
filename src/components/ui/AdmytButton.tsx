import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

type AdmytButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark'
  children: ReactNode
}

export default function AdmytButton({ variant = 'primary', children, style, ...props }: AdmytButtonProps) {
  const styles: Record<NonNullable<AdmytButtonProps['variant']>, CSSProperties> = {
    primary: {
      background: 'var(--admyt-grad)',
      color: 'white',
      border: 'none',
      boxShadow: 'var(--shadow-float)',
    },
    secondary: {
      background: 'var(--admyt-lavender)',
      color: 'var(--admyt-indigo)',
      border: '1px solid var(--admyt-line)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--admyt-muted)',
      border: 'none',
    },
    dark: {
      background: 'rgba(255,255,255,0.14)',
      color: 'white',
      border: '1px solid rgba(255,255,255,0.26)',
    },
  }

  return (
    <button
      {...props}
      style={{
        borderRadius: variant === 'primary' ? '8px' : '8px',
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: 700,
        cursor: props.disabled ? 'default' : 'pointer',
        opacity: props.disabled ? 0.58 : 1,
        fontFamily: 'inherit',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
        ...styles[variant],
        ...style,
      }}
      className="admyt-focus"
    >
      {children}
    </button>
  )
}
