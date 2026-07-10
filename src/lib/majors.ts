import type { StudentProfile } from '@/context/ProfileContext'

export function getPreferredMajorTerms(profile: StudentProfile | null) {
  return [
    profile?.intendedMajor,
    ...(profile?.preferredMajors ?? []),
  ]
    .filter((term): term is string => typeof term === 'string' && term.trim().length > 0)
    .map(term => term.toLowerCase())
}

export function orderMajorsForProfile(majors: string[], profile: StudentProfile | null) {
  const preferredMajors = getPreferredMajorTerms(profile)
  return majors
    .map((major, index) => ({ major, index }))
    .sort((a, b) => {
      const aMatch = preferredMajors.some(term => a.major.toLowerCase().includes(term) || term.includes(a.major.toLowerCase()))
      const bMatch = preferredMajors.some(term => b.major.toLowerCase().includes(term) || term.includes(b.major.toLowerCase()))
      if (aMatch !== bMatch) return aMatch ? -1 : 1
      return a.index - b.index
    })
    .map(item => item.major)
}
