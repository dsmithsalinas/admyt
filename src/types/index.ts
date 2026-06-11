export interface Student {
  id: string
  name: string
  email: string
  gpa?: number
  satScore?: number
  actScore?: number
  interests: string[]
  preferredLocations: string[]
  sizePreference: 'small' | 'medium' | 'large' | 'any'
  createdAt: string
}

export interface College {
  id: string
  name: string
  location: string
  state: string
  type: 'public' | 'private'
  size: 'small' | 'medium' | 'large'
  acceptanceRate: number
  avgGpa: number
  avgSat?: number
  avgAct?: number
  tuition: number
  description: string
  majors: string[]
  vibeScore?: VibeScore
}

export interface VibeScore {
  collegeId: string
  social: number
  diversity: number
  greekLife: number
  athletics: number
  arts: number
  outdoor: number
  summary: string
}

export interface CollegeMatch {
  college: College
  matchScore: number
  admitOdds: number
  reasons: string[]
}

export interface SearchFilters {
  location?: string[]
  size?: College['size'][]
  type?: College['type'][]
  maxTuition?: number
  minAcceptanceRate?: number
}
