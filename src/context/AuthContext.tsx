import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { LEGAL_VERSION } from '@/lib/legal'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: (legalConsent: boolean) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<string | null>
  signUpWithEmail: (email: string, password: string, legalConsent: boolean) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)
const PENDING_LEGAL_ACCEPTANCE_KEY = 'admyt_pending_legal_acceptance'
let legalAcceptanceWriteInFlight = false

async function recordPendingLegalAcceptance(session: Session | null) {
  if (!session || legalAcceptanceWriteInFlight || localStorage.getItem(PENDING_LEGAL_ACCEPTANCE_KEY) !== LEGAL_VERSION) return
  legalAcceptanceWriteInFlight = true
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        admyt_terms_version: LEGAL_VERSION,
        admyt_terms_accepted_at: new Date().toISOString(),
        admyt_age_13_plus_confirmed: true,
        admyt_guardian_permission_confirmed_if_required: true,
      },
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

  async function signInWithGoogle(legalConsent: boolean) {
    if (!legalConsent) return
    localStorage.setItem(PENDING_LEGAL_ACCEPTANCE_KEY, LEGAL_VERSION)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) localStorage.removeItem(PENDING_LEGAL_ACCEPTANCE_KEY)
  }

  async function signInWithEmail(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  async function signUpWithEmail(email: string, password: string, legalConsent: boolean): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
    if (!legalConsent) return { error: 'Please agree to the Terms and Privacy Policy to create an account.', needsEmailConfirmation: false }
    const acceptedAt = new Date().toISOString()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          admyt_terms_version: LEGAL_VERSION,
          admyt_terms_accepted_at: acceptedAt,
          admyt_age_13_plus_confirmed: true,
          admyt_guardian_permission_confirmed_if_required: true,
        },
      },
    })
    // If the project requires email confirmation, sign-up succeeds with no error
    // and no session — the user is not actually logged in yet.
    return { error: error?.message ?? null, needsEmailConfirmation: !error && !data.session }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signInWithGoogle, signInWithEmail, signUpWithEmail, signOut,
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
