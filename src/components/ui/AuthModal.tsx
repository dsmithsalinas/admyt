import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Modal from '@/components/ui/Modal'
import SageOrb from '@/components/sage/SageOrb'

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
  const [confirmSent, setConfirmSent] = useState(false)

  const headline = trigger === 'vibecheck'
    ? 'Save your Vibe Check'
    : 'Find where you fit'

  const subline = trigger === 'vibecheck'
    ? "Create a free account so you can come back to these results — and keep building your list."
    : "It's free. Save your schools, your Vibe Checks, and your conversation with Sage."

  async function handleEmailSubmit() {
    if (!email || !password) return
    setLoading(true)
    setError(null)
    if (mode === 'signup') {
      const { error, needsEmailConfirmation } = await signUpWithEmail(email, password)
      setLoading(false)
      if (error) setError(error)
      else if (needsEmailConfirmation) setConfirmSent(true)
      else onSuccess()
    } else {
      const err = await signInWithEmail(email, password)
      setLoading(false)
      if (err) setError(err)
      else onSuccess()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleEmailSubmit()
  }

  return (
    <Modal onClose={onClose} labelledBy="auth-modal-title" panelStyle={{ maxWidth: 420, padding: '28px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <SageOrb size={58} animate />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--admyt-lavender)', border: '1px solid var(--admyt-line)',
          borderRadius: 20, padding: '3px 10px',
          fontSize: 12, fontWeight: 800, color: 'var(--admyt-indigo)',
          margin: '0 auto 10px', width: 'fit-content',
        }}>
          Free account
        </div>
        <h2 id="auth-modal-title" style={{ fontSize: 22, fontWeight: 800, color: 'var(--admyt-ink)', textAlign: 'center', margin: 0 }}>
          {headline}
        </h2>
        <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 4, color: 'var(--admyt-muted)', textAlign: 'center' }}>
          {subline}
        </p>
      </div>

      {confirmSent ? (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--admyt-slate)' }}>
            Check your email — we sent a confirmation link to <strong>{email}</strong>. Click it to finish setting up your account, then come back and sign in.
          </p>
          <button
            className="btn"
            onClick={() => { setConfirmSent(false); setMode('signin'); setPassword('') }}
            style={{ width: '100%', height: 42, marginTop: 16, borderRadius: 999 }}
          >
            Back to sign in
          </button>
        </div>
      ) : (
      <>
      <button
        onClick={signInWithGoogle}
        className="btn secondary"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, height: 42, borderRadius: 999, color: 'var(--admyt-ink)' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--admyt-line)' }} />
        <span style={{ fontSize: 12, color: 'var(--admyt-faint)' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--admyt-line)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <input
          className="field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKey}
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKey}
        />
      </div>

      {error && (
        <div style={{
          fontSize: 12, color: '#DC2626',
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 10, padding: '8px 12px', marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleEmailSubmit}
        disabled={loading || !email || !password}
        className="btn"
        style={{ width: '100%', height: 42, marginBottom: 16, borderRadius: 999, boxShadow: 'var(--shadow-float)', opacity: loading || !email || !password ? 0.58 : 1 }}
      >
        {loading ? 'One sec...' : mode === 'signup' ? 'Create free account' : 'Sign in'}
      </button>

      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--admyt-muted)' }}>
        {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
        <button
          onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null) }}
          style={{ background: 'none', border: 0, padding: 0, fontSize: 13, fontWeight: 700, color: 'var(--admyt-indigo)', cursor: 'pointer', font: 'inherit' }}
        >
          {mode === 'signup' ? 'Sign in' : 'Sign up'}
        </button>
      </div>
      </>
      )}

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 0, fontSize: 12, color: 'var(--admyt-faint)', cursor: 'pointer', padding: '4px 8px', font: 'inherit' }}
        >
          Keep going without an account
        </button>
      </div>
    </Modal>
  )
}
