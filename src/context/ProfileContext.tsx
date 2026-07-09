import { createContext, useContext, useState } from 'react'

export interface StudentProfile {
  preferredLocations: string[]
  careerGoals: string[]
  intendedMajor?: string
  complete: boolean
}

interface ProfileContextType {
  profile: StudentProfile | null
  setProfile: (p: StudentProfile) => void
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
  const [profile, setProfileState] = useState<StudentProfile | null>(() => loadStored())

  function setProfile(p: StudentProfile) {
    setProfileState(p)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* storage unavailable — state still updates */
    }
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
    <ProfileContext.Provider value={{ profile, setProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
