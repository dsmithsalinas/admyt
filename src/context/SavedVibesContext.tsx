import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getAllSavedVibes, type SavedVibe } from '@/lib/savedVibes'

interface SavedVibesContextType {
  vibeScoreFor: (collegeId: string) => number | undefined
  savedVibeFor: (collegeId: string) => SavedVibe | undefined
  refresh: () => Promise<void>
}

const SavedVibesContext = createContext<SavedVibesContextType | null>(null)

export function SavedVibesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [savedVibes, setSavedVibes] = useState<Map<string, SavedVibe>>(new Map())

  const refresh = useCallback(async () => {
    if (!user) {
      setSavedVibes(new Map())
      return
    }

    const vibes = await getAllSavedVibes(user.id)
    setSavedVibes(new Map(vibes.map(vibe => [vibe.college_id, vibe])))
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!user) {
      setSavedVibes(new Map())
      return
    }

    let cancelled = false
    getAllSavedVibes(user.id).then(vibes => {
      if (cancelled) return
      setSavedVibes(new Map(vibes.map(vibe => [vibe.college_id, vibe])))
    })

    return () => { cancelled = true }
  }, [user, loading])

  const vibeScoreFor = useCallback((collegeId: string) => {
    return savedVibes.get(collegeId)?.fit_score
  }, [savedVibes])

  const savedVibeFor = useCallback((collegeId: string) => {
    return savedVibes.get(collegeId)
  }, [savedVibes])

  return (
    <SavedVibesContext.Provider value={{ vibeScoreFor, savedVibeFor, refresh }}>
      {children}
    </SavedVibesContext.Provider>
  )
}

export function useSavedVibes() {
  const ctx = useContext(SavedVibesContext)
  if (!ctx) throw new Error('useSavedVibes must be used inside SavedVibesProvider')
  return ctx
}
