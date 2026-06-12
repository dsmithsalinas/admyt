import type { College } from './colleges'
import type { StudentProfile } from '@/context/ProfileContext'

export function scoreCollege(college: College, profile: StudentProfile | null): number {
  if (!profile) {
    return Math.min(((parseInt(college.id) * 37) % 40) + 60, 99)
  }

  let score = 50
  const goals = profile.careerGoals.map(g => g.toLowerCase())
  const locations = profile.preferredLocations.map(l => l.toLowerCase())

  // Major match — up to 25 points
  const majorMatches = college.majors.filter(m =>
    goals.some(g => m.toLowerCase().includes(g) || g.includes(m.toLowerCase()))
  )
  score += Math.min(majorMatches.length * 12, 25)

  // Intended major exact match — bonus 10 points
  if (profile.intendedMajor) {
    const exactMatch = college.majors.some(m =>
      m.toLowerCase().includes(profile.intendedMajor!.toLowerCase())
    )
    if (exactMatch) score += 10
  }

  // Location match — up to 20 points
  const locationMatch = locations.some(loc =>
    college.state.toLowerCase().includes(loc) ||
    college.location.toLowerCase().includes(loc) ||
    loc.includes(college.state.toLowerCase())
  )
  if (locationMatch) score += 20

  // Career goal keyword match in description — up to 10 points
  if (college.description) {
    const descMatch = goals.some(g => college.description!.toLowerCase().includes(g))
    if (descMatch) score += 10
  }

  // Slight per-college jitter so scores feel varied
  const jitter = ((parseInt(college.id) * 13) % 7) - 3
  score += jitter

  return Math.max(10, Math.min(score, 99))
}
