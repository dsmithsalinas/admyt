import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { LEGAL_VERSION } from '@/lib/legal'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: (legalConsent: boolean) => Promise<string | null>
  signInWithApple: (legalConsent: boolean) => Promise<string | null>
  sendEmailCode: (email: string, legalConsent: boolean) => Promise<string | null>
  verifyEmailCode: (email: string, code: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)
const PENDING_LEGAL_ACCEPTANCE_KEY = 'admyt_pending_legal_acceptance'
let legalAcceptanceWriteInFlight = false

function legalAcceptanceMetadata() {
  return {
    admyt_terms_version: LEGAL_VERSION,
    admyt_terms_accepted_at: new Date().toISOString(),
    admyt_age_13_plus_confirmed: true,
    admyt_guardian_permission_confirmed_if_required: true,
  }
}

async function recordPendingLegalAcceptance(session: Session | null) {
  if (!session || legalAcceptanceWriteInFlight || localStorage.getItem(PENDING_LEGAL_ACCEPTANCE_KEY) !== LEGAL_VERSION) return
  legalAcceptanceWriteInFlight = true
  try {
    const { error } = await supabase.auth.updateUser({
      data: legalAcceptanceMetadata(),
    })
    if (!error) localStorage.removeItem(PENDING_LEGAL_ACCEPTANCE_KEY)
  } finally {
    legalAcceptanceWriteInFlight = false
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      void recordPendingLegalAcceptance(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      void recordPendingLegalAcceptance(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithProvider(provider: 'google' | 'apple', legalConsent: boolean): Promise<string | null> {
    if (!legalConsent) return 'Please agree to the Terms and Privacy Policy to continue.'
    localStorage.setItem(PENDING_LEGAL_ACCEPTANCE_KEY, LEGAL_VERSION)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    if (error) localStorage.removeItem(PENDING_LEGAL_ACCEPTANCE_KEY)
    return error?.message ?? null
  }

  async function signInWithGoogle(legalConsent: boolean) {
    return signInWithProvider('google', legalConsent)
  }

  async function signInWithApple(legalConsent: boolean) {
    return signInWithProvider('apple', legalConsent)
  }

  async function sendEmailCode(email: string, legalConsent: boolean): Promise<string | null> {
    if (!legalConsent) return 'Please agree to the Terms and Privacy Policy to continue.'
    localStorage.setItem(PENDING_LEGAL_ACCEPTANCE_KEY, LEGAL_VERSION)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: legalAcceptanceMetadata(),
      },
    })
    if (error) localStorage.removeItem(PENDING_LEGAL_ACCEPTANCE_KEY)
    return error?.message ?? null
  }

  async function verifyEmailCode(email: string, code: string): Promise<string | null> {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'email',
    })
    if (!error) await recordPendingLegalAcceptance(data.session)
    return error?.message ?? null
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signInWithGoogle, signInWithApple, sendEmailCode, verifyEmailCode, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
