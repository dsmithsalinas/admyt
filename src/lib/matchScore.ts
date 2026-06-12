import type { College } from './colleges'
import type { StudentProfile } from '@/context/ProfileContext'

export function scoreCollege(college: College, profile: StudentProfile | null): number {
  if (!profile) {
    // No profile — return a varied but neutral score in the 45–65 range
    return ((parseInt(college.id) * 37) % 21) + 45
  }

  const hasAnyProfile = !!(
    profile.intendedMajor ||
    profile.careerGoals.length > 0 ||
    profile.preferredLocations.length > 0
  )

  if (!hasAnyProfile) {
    return ((parseInt(college.id) * 37) % 21) + 45
  }

  // Base: 35 (no overlap = low-40s after jitter)
  let score = 35

  const goals = profile.careerGoals.map(g => g.toLowerCase())
  const locations = profile.preferredLocations.map(l => l.toLowerCase())

  // Major match via career goals — up to 18 points
  const majorMatches = college.majors.filter(m =>
    goals.some(g => m.toLowerCase().includes(g) || g.includes(m.toLowerCase()))
  )
  score += Math.min(majorMatches.length * 8, 18)

  // Intended major exact match — up to 14 points
  if (profile.intendedMajor) {
    const exactMatch = college.majors.some(m =>
      m.toLowerCase().includes(profile.intendedMajor!.toLowerCase())
    )
    if (exactMatch) score += 14
  }

  // Location match — up to 16 points
  if (locations.length > 0) {
    const locationMatch = locations.some(loc =>
      college.state.toLowerCase().includes(loc) ||
      college.location.toLowerCase().includes(loc) ||
      loc.includes(college.state.toLowerCase())
    )
    if (locationMatch) score += 16
  }

  // Career goal keyword match in description — up to 7 points
  if (college.description && goals.length > 0) {
    const descMatch = goals.some(g => college.description!.toLowerCase().includes(g))
    if (descMatch) score += 7
  }

  // Per-college jitter ±4 so scores feel varied
  const jitter = ((parseInt(college.id) * 13) % 9) - 4
  score += jitter

  return Math.max(25, Math.min(score, 95))
}
