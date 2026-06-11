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

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null)

  function clearProfile() {
    setProfile(null)
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
