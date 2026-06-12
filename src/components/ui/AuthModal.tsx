import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/shadcn'

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

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent style={{ maxWidth: '400px', padding: '28px 24px' }}>
        <DialogHeader style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#EEF2FF', border: '0.5px solid #C7D2FE',
            borderRadius: '20px', padding: '3px 10px',
            fontSize: '12px', fontWeight: 500, color: '#4338CA',
            marginBottom: '10px', width: 'fit-content',
          }}>
            ✨ Free account
          </div>
          <DialogTitle style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '-0.3px' }}>
            {headline}
          </DialogTitle>
          <DialogDescription style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '4px' }}>
            {subline}
          </DialogDescription>
        </DialogHeader>

        <Button
          variant="outline"
          onClick={signInWithGoogle}
          style={{ width: '100%', justifyContent: 'center', gap: '8px', marginBottom: '16px', height: '42px' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>or</span>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
            style={{ height: '42px', fontSize: '14px' }}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            style={{ height: '42px', fontSize: '14px' }}
          />
        </div>

        {error && (
          <div style={{
            fontSize: '12px', color: '#DC2626',
            background: '#FEF2F2', border: '0.5px solid #FECACA',
            borderRadius: '6px', padding: '8px 12px', marginBottom: '12px',
          }}>
            {error}
          </div>
        )}

        <Button
          onClick={handleEmailSubmit}
          disabled={loading || !email || !password}
          style={{ width: '100%', height: '42px', marginBottom: '16px' }}
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create free account' : 'Sign in'}
        </Button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <Button
            variant="link"
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null) }}
            style={{ fontSize: '13px', height: 'auto', padding: 0 }}
          >
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <Button
            variant="ghost"
            onClick={onClose}
            style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', height: 'auto', padding: '4px 8px' }}
          >
            Continue as guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
