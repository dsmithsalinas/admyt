import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
  trigger?: 'vibecheck' | 'general'
}

export default function AuthModal({ onClose, onSuccess, trigger = 'general' }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const headline = trigger === 'vibecheck'
    ? 'Save your Vibe Check results'
    : 'Create your Admyt profile'

  const subline = trigger === 'vibecheck'
    ? 'Create a free account to save your results and come back to them anytime.'
    : 'Sign up to save your college list, profile, and Vibe Check results.'

  async function handleEmailSubmit() {
    if (!email || !password) return
    setLoading(true)
    setError(null)
    const fn = mode === 'signup' ? signUpWithEmail : signInWithEmail
    const err = await fn(email, password)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleEmailSubmit()
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    border: '0.5px solid var(--color-border-secondary)',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-background-primary)',
          borderRadius: '16px',
          padding: '28px 24px',
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '18px', color: 'var(--color-text-tertiary)',
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#EEF2FF', border: '0.5px solid #C7D2FE',
            borderRadius: '20px', padding: '3px 10px',
            fontSize: '12px', fontWeight: 500, color: '#4338CA',
            marginBottom: '10px',
          }}>
            ✨ Free account
          </div>
          <h2 style={{
            fontSize: '20px', fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: '6px', letterSpacing: '-0.3px',
          }}>
            {headline}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {subline}
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          style={{
            width: '100%', padding: '11px',
            borderRadius: '8px', fontSize: '14px',
            border: '0.5px solid var(--color-border-secondary)',
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer', fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: '16px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>or</span>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            fontSize: '12px', color: '#DC2626',
            background: '#FEF2F2', border: '0.5px solid #FECACA',
            borderRadius: '6px', padding: '8px 12px',
            marginBottom: '12px',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleEmailSubmit}
          disabled={loading || !email || !password}
          style={{
            width: '100%', padding: '11px',
            borderRadius: '8px', fontSize: '14px',
            background: email && password ? '#6366F1' : 'var(--color-background-secondary)',
            color: email && password ? 'white' : 'var(--color-text-tertiary)',
            border: 'none', cursor: email && password ? 'pointer' : 'default',
            fontWeight: 500, marginBottom: '16px',
          }}
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create free account' : 'Sign in'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null) }}
            style={{
              color: '#6366F1', background: 'none',
              border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, padding: 0,
            }}
          >
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            onClick={onClose}
            style={{
              fontSize: '12px', color: 'var(--color-text-tertiary)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  )
}
