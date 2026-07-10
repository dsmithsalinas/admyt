import type { College } from './colleges'
import type { StudentProfile } from '@/context/ProfileContext'

// A Fit Score is only meaningful once Sage knows something about the student.
// Without any saved preference signal the number is noise — hide it.
export function hasEnoughProfileForScore(profile: StudentProfile | null): boolean {
  if (!profile) return false
  return !!(
    (profile.preferredStates && profile.preferredStates.length > 0) ||
    (profile.preferredLocations && profile.preferredLocations.length > 0) ||
    (profile.preferredMajors && profile.preferredMajors.length > 0) ||
    profile.intendedMajor ||
    (profile.careerGoals && profile.careerGoals.length > 0) ||
    profile.maxTuition != null ||
    profile.preferredSize ||
    (profile.preferredInstitutionType && profile.preferredInstitutionType !== 'either')
  )
}

function neutralScore(collegeId: string): number {
  // No profile — return a varied but neutral score in the 45-65 range.
  return ((parseInt(collegeId) * 37) % 21) + 45
}

function normalizeTerms(terms: (string | undefined)[]): string[] {
  return terms
    .filter((term): term is string => typeof term === 'string' && term.trim().length > 0)
    .map(term => term.trim().toLowerCase())
}

function hasTermMatch(haystack: string, terms: string[]): boolean {
  const target = haystack.toLowerCase()
  return terms.some(term => target.includes(term) || term.includes(target))
}

function institutionTypeMatches(
  preference: StudentProfile['preferredInstitutionType'],
  degreesPredominant: number | undefined,
): boolean | null {
  if (!preference || preference === 'either' || degreesPredominant == null) return null
  if (preference === 'two_year') return degreesPredominant === 2
  return degreesPredominant >= 3
}

export function scoreCollege(college: College, profile: StudentProfile | null): number {
  if (!profile) return neutralScore(college.id)

  const hasAnyProfile = !!(
    profile.intendedMajor ||
    (profile.careerGoals?.length ?? 0) > 0 ||
    (profile.preferredLocations?.length ?? 0) > 0 ||
    (profile.preferredStates?.length ?? 0) > 0 ||
    (profile.preferredMajors?.length ?? 0) > 0 ||
    profile.maxTuition != null ||
    profile.preferredSize ||
    (profile.preferredInstitutionType && profile.preferredInstitutionType !== 'either')
  )

  if (!hasAnyProfile) {
    return neutralScore(college.id)
  }

  // Start from a neutral read, then let strong matches and hard mismatches move
  // schools far enough apart that "Best fit first" feels meaningfully sorted.
  let score = 50

  const preferredStates = (profile.preferredStates ?? [])
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
  const preferredLocations = normalizeTerms(profile.preferredLocations ?? [])
  const preferredMajors = normalizeTerms([
    ...(profile.preferredMajors ?? []),
    profile.intendedMajor,
  ])
  const intendedMajor = normalizeTerms([profile.intendedMajor])
  const goals = normalizeTerms(profile.careerGoals ?? [])
  const collegeMajors = college.majors.map(m => m.toLowerCase())

  if (preferredStates.length > 0) {
    score += preferredStates.includes(college.state.toUpperCase()) ? 24 : -12
  }

  if (preferredLocations.length > 0) {
    const locationMatch = preferredLocations.some(loc =>
      college.location.toLowerCase().includes(loc) ||
      college.state.toLowerCase() === loc ||
      loc.includes(college.state.toLowerCase())
    )
    score += locationMatch ? 16 : -6
  }

  const typeMatch = institutionTypeMatches(profile.preferredInstitutionType, college.degreesPredominant)
  if (typeMatch === true) score += 24
  if (typeMatch === false) score -= 30

  if (profile.preferredSize) {
    score += college.size === profile.preferredSize ? 12 : -10
  }

  if (profile.maxTuition != null) {
    const tuition = college.tuitionOutState ?? college.tuitionInState
    if (tuition != null) {
      if (tuition <= profile.maxTuition) {
        score += 10
      } else {
        const overage = tuition - profile.maxTuition
        score -= Math.min(30, 10 + Math.ceil(overage / 5000) * 4)
      }
    }
  }

  if (preferredMajors.length > 0) {
    const matchedCount = collegeMajors.filter(major => hasTermMatch(major, preferredMajors)).length
    score += Math.min(matchedCount * 10, 20)
  }

  if (intendedMajor.length > 0 && collegeMajors.some(major => hasTermMatch(major, intendedMajor))) {
    score += 10
  }

  if (goals.length > 0) {
    const goalMajorMatches = collegeMajors.filter(major => hasTermMatch(major, goals)).length
    score += Math.min(goalMajorMatches * 6, 12)
  }

  if (college.description && goals.length > 0) {
    const descMatch = goals.some(goal => college.description!.toLowerCase().includes(goal))
    if (descMatch) score += 6
  }

  // Per-college jitter +/-5 so equivalent schools do not all tie.
  const jitter = ((parseInt(college.id) * 13) % 11) - 5
  score += jitter

  return Math.max(0, Math.min(Math.round(score), 100))
}
