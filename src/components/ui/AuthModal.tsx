import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Modal from '@/components/ui/Modal'
import SageOrb from '@/components/sage/SageOrb'
import { Link } from 'react-router-dom'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
  trigger?: 'vibecheck' | 'general' | 'heart'
}

export default function AuthModal({ onClose, onSuccess, trigger = 'general' }: AuthModalProps) {
  const { signInWithGoogle, signInWithApple, sendEmailCode, verifyEmailCode } = useAuth()
  const appleAuthEnabled = import.meta.env.VITE_APPLE_AUTH_ENABLED === 'true'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<'google' | 'apple' | 'email' | 'verify' | 'resend' | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const [legalConsent, setLegalConsent] = useState(false)

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = window.setTimeout(() => setResendSeconds(seconds => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendSeconds])

  const headline = trigger === 'vibecheck'
    ? 'Save your Vibe Check'
    : trigger === 'heart'
    ? 'Save this school'
    : 'Find where you fit'

  const subline = trigger === 'vibecheck'
    ? "Create a free account so you can come back to these results — and keep building your list."
    : trigger === 'heart'
    ? "Hearting helps Sage learn your taste. Make a free account so your schools are still here when you come back."
    : "It's free. Save your schools, your Vibe Checks, and your conversation with Sage."

  async function handleProvider(provider: 'google' | 'apple') {
    if (loading) return
    setLoading(provider)
    setError(null)
    const providerError = provider === 'google'
      ? await signInWithGoogle(legalConsent)
      : await signInWithApple(legalConsent)
    if (providerError) {
      setError(providerError)
      setLoading(null)
    }
  }

  async function handleSendCode(isResend = false) {
    if (!email.trim() || loading || (!isResend && !legalConsent)) return
    setLoading(isResend ? 'resend' : 'email')
    setError(null)
    const sendError = await sendEmailCode(email, legalConsent)
    setLoading(null)
    if (sendError) {
      setError(sendError)
      return
    }
    setCodeSent(true)
    setResendSeconds(60)
  }

  async function handleVerifyCode() {
    if (code.length !== 6 || loading) return
    setLoading('verify')
    setError(null)
    const verifyError = await verifyEmailCode(email, code)
    setLoading(null)
    if (verifyError) setError(verifyError)
    else onSuccess()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    if (codeSent) void handleVerifyCode()
    else void handleSendCode()
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

      {codeSent ? (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--admyt-slate)' }}>
            Check your email — we sent a six-digit code to <strong>{email}</strong>.
          </p>
          <input
            className="field"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Six-digit code"
            placeholder="6-digit code"
            value={code}
            maxLength={6}
            autoFocus
            onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={handleKey}
            style={{ marginTop: 12, textAlign: 'center', letterSpacing: '0.2em', fontWeight: 800 }}
          />
          {error && <AuthError message={error} />}
          <button
            className="btn"
            onClick={handleVerifyCode}
            disabled={loading !== null || code.length !== 6}
            style={{ width: '100%', height: 42, marginTop: 12, borderRadius: 999, opacity: loading !== null || code.length !== 6 ? 0.58 : 1 }}
          >
            {loading === 'verify' ? 'Checking...' : 'Continue'}
          </button>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14, fontSize: 12 }}>
            <button
              onClick={() => void handleSendCode(true)}
              disabled={loading !== null || resendSeconds > 0}
              style={{ background: 'none', border: 0, padding: 0, color: 'var(--admyt-indigo)', cursor: resendSeconds > 0 ? 'default' : 'pointer', font: 'inherit', fontWeight: 700 }}
            >
              {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : loading === 'resend' ? 'Sending...' : 'Resend code'}
            </button>
            <button
              onClick={() => { setCodeSent(false); setCode(''); setError(null); setResendSeconds(0) }}
              style={{ background: 'none', border: 0, padding: 0, color: 'var(--admyt-muted)', cursor: 'pointer', font: 'inherit' }}
            >
              Change email
            </button>
          </div>
        </div>
      ) : (
      <>
      <label className="auth-legal-consent">
        <input type="checkbox" checked={legalConsent} onChange={event => setLegalConsent(event.target.checked)} />
        <span>
          I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms</Link> and <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>. I’m at least 13 and, if I’m under 18, I have permission from a parent or guardian.
        </span>
      </label>

      <button
        onClick={() => void handleProvider('google')}
        disabled={!legalConsent || loading !== null}
        className="btn secondary"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, height: 42, borderRadius: 999, color: 'var(--admyt-ink)' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {loading === 'google' ? 'One sec...' : 'Continue with Google'}
      </button>

      {appleAuthEnabled && (
        <button
          onClick={() => void handleProvider('apple')}
          disabled={!legalConsent || loading !== null}
          className="btn secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, height: 42, borderRadius: 999, color: 'var(--admyt-ink)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.1zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          {loading === 'apple' ? 'One sec...' : 'Continue with Apple'}
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--admyt-line)' }} />
        <span style={{ fontSize: 12, color: 'var(--admyt-faint)' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--admyt-line)' }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          className="field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKey}
        />
      </div>

      {error && <AuthError message={error} />}

      <button
        onClick={() => void handleSendCode()}
        disabled={loading !== null || !email.trim() || !legalConsent}
        className="btn"
        style={{ width: '100%', height: 42, marginBottom: 8, borderRadius: 999, boxShadow: 'var(--shadow-float)', opacity: loading !== null || !email.trim() || !legalConsent ? 0.58 : 1 }}
      >
        {loading === 'email' ? 'Sending...' : 'Continue with email'}
      </button>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--admyt-faint)', marginBottom: 8 }}>
        No password needed. We’ll email you a code.
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

function AuthError({ message }: { message: string }) {
  return (
    <div style={{
      fontSize: 12, color: '#DC2626', textAlign: 'left',
      background: '#FEF2F2', border: '1px solid #FECACA',
      borderRadius: 10, padding: '8px 12px', marginTop: 12, marginBottom: 12,
    }}>
      {message}
    </div>
  )
}
