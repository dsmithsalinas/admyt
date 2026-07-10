import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { loadProfilePreferences, mergeProfilePreferenceFields } from '@/lib/profilePreferences'

export interface StudentProfile {
  preferredLocations: string[]
  careerGoals: string[]
  intendedMajor?: string
  preferredStates?: string[]
  maxTuition?: number | null
  preferredMajors?: string[]
  preferredSize?: 'small' | 'medium' | 'large' | null
  preferredInstitutionType?: 'two_year' | 'four_year' | 'either' | null
  complete: boolean
}

interface ProfileContextType {
  profile: StudentProfile | null
  setProfile: (p: StudentProfile) => void
  mergeProfile: (p: Partial<StudentProfile>) => void
  clearProfile: () => void
}

const ProfileContext = createContext<ProfileContextType | null>(null)

// Device-local mirror of the chat-learned profile. Keeps what Sage learns alive
// across reloads for guests, and gives signed-in users instant hydration before
// the authoritative copy loads from Supabase.
const STORAGE_KEY = 'admyt_sage_profile'

function loadStored(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StudentProfile) : null
  } catch {
    return null
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [profile, setProfileState] = useState<StudentProfile | null>(() => loadStored())

  useEffect(() => {
    if (loading) return
    if (!user) return

    let cancelled = false
    loadProfilePreferences(user.id).then(prefs => {
      if (cancelled) return
      setProfileState(prev => {
        const merged = mergeProfilePreferenceFields(prev, prefs)
        try {
          if (merged) localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        } catch {
          /* storage unavailable — state still updates */
        }
        return merged
      })
    })

    return () => { cancelled = true }
  }, [user, loading])

  function setProfile(p: StudentProfile) {
    setProfileState(p)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* storage unavailable — state still updates */
    }
  }

  function mergeProfile(p: Partial<StudentProfile>) {
    setProfileState(prev => {
      const merged: StudentProfile = {
        preferredLocations: [],
        careerGoals: [],
        complete: false,
        ...prev,
        ...p,
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      } catch {
        /* storage unavailable — state still updates */
      }
      return merged
    })
  }

  function clearProfile() {
    setProfileState(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* no-op */
    }
  }

  return (
    <ProfileContext.Provider value={{ profile, setProfile, mergeProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
