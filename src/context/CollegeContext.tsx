import { createContext, useContext, useEffect, useState } from 'react'
import { getColleges } from '@/lib/colleges'
import type { College } from '@/lib/colleges'

interface CollegeContextType {
  colleges: College[]
  loading: boolean
  error: string | null
}

const CollegeContext = createContext<CollegeContextType | null>(null)

export function CollegeProvider({ children }: { children: React.ReactNode }) {
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getColleges()
      .then(data => {
        setColleges(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <CollegeContext.Provider value={{ colleges, loading, error }}>
      {children}
    </CollegeContext.Provider>
  )
}

export function useColleges() {
  const ctx = useContext(CollegeContext)
  if (!ctx) throw new Error('useColleges must be used inside CollegeProvider')
  return ctx
}
