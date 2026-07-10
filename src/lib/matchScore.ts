import type { College } from './colleges'
import type { StudentProfile } from '@/context/ProfileContext'
import { expandLocationTerms, REGION_TO_STATES, STATE_NAME_TO_ABBR } from './regions'

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

const STATE_ABBR_TO_NAME = Object.entries(STATE_NAME_TO_ABBR).reduce<Record<string, string>>(
  (names, [name, abbr]) => {
    names[abbr] = name.replace(/\b\w/g, char => char.toUpperCase())
    return names
  },
  {},
)

const REGION_LABELS: Record<string, string> = {
  pnw: 'Pacific Northwest',
  'pacific northwest': 'Pacific Northwest',
  'west coast': 'West Coast',
  'new england': 'New England',
  'mid-atlantic': 'Mid-Atlantic',
  midwest: 'Midwest',
  northeast: 'Northeast',
  south: 'South',
  southeast: 'Southeast',
  southwest: 'Southwest',
  'mountain west': 'Mountain West',
  rockies: 'Rockies',
  'great lakes': 'Great Lakes',
  'deep south': 'Deep South',
}

function formatSize(size: College['size']): string {
  return size.charAt(0).toUpperCase() + size.slice(1)
}

function sizeMismatchLabel(actual: College['size'], preferred: NonNullable<StudentProfile['preferredSize']>): string {
  const sizeOrder: Record<College['size'], number> = { small: 1, medium: 2, large: 3 }
  return sizeOrder[actual] > sizeOrder[preferred] ? 'Bigger than you wanted' : 'Smaller than you wanted'
}

function institutionTypeLabel(preference: Exclude<StudentProfile['preferredInstitutionType'], null | undefined | 'either'>): string {
  return preference === 'two_year' ? 'two-year' : 'four-year'
}

function collegeInstitutionType(degreesPredominant: number | undefined): 'two-year' | 'four-year' | null {
  if (degreesPredominant == null) return null
  return degreesPredominant === 2 ? 'two-year' : 'four-year'
}

function findMatchedMajor(college: College, profile: StudentProfile): string | null {
  const preferredMajors = normalizeTerms([
    ...(profile.preferredMajors ?? []),
    profile.intendedMajor,
  ])

  if (preferredMajors.length === 0) return null

  return college.majors.find(major => hasTermMatch(major, preferredMajors)) ?? null
}

function preferredRegionForState(preferredLocations: string[], state: string): string | null {
  const collegeState = state.toUpperCase()

  for (const location of preferredLocations) {
    const term = location.trim().toLowerCase()
    const regionStates = REGION_TO_STATES[term]
    if (regionStates?.includes(collegeState)) {
      return REGION_LABELS[term] ?? location.trim()
    }
  }

  return null
}

function preferredDirectState(
  preferredStates: string[],
  preferredLocations: string[],
  state: string,
): string | null {
  const collegeState = state.toUpperCase()
  const directStates = new Set([
    ...preferredStates.map(s => s.trim().toUpperCase()).filter(Boolean),
  ])

  for (const location of preferredLocations) {
    const term = location.trim().toLowerCase()
    const stateAbbr = STATE_NAME_TO_ABBR[term]
    if (stateAbbr) directStates.add(stateAbbr)
    if (term.toUpperCase() === collegeState) directStates.add(collegeState)
  }

  return directStates.has(collegeState) ? (STATE_ABBR_TO_NAME[collegeState] ?? collegeState) : null
}

export function explainFit(college: College, profile: StudentProfile | null): string[] {
  if (!profile || !hasEnoughProfileForScore(profile)) {
    return ['Worth a look while Sage learns more about you']
  }

  const reasons: { text: string; weight: number; order: number }[] = []
  const addReason = (text: string, weight: number) => {
    reasons.push({ text, weight, order: reasons.length })
  }
  const preferredStates = (profile.preferredStates ?? [])
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
  const preferredLocations = profile.preferredLocations ?? []
  const expandedLocations = expandLocationTerms(preferredLocations)
  const targetStates = new Set([
    ...preferredStates,
    ...expandedLocations.states,
  ])

  if (targetStates.size > 0) {
    if (targetStates.has(college.state.toUpperCase())) {
      const directState = preferredDirectState(preferredStates, preferredLocations, college.state)
      const preferredRegion = preferredRegionForState(preferredLocations, college.state)

      if (directState) {
        addReason(`In ${directState}, right in your region`, 24)
      } else if (preferredRegion) {
        addReason(`In the ${preferredRegion}, where you want to be`, 24)
      } else {
        addReason('In a state you named', 24)
      }
    } else {
      addReason('Outside the regions you named', 24)
    }
  }

  if (expandedLocations.freeText.length > 0) {
    const cityMatch = expandedLocations.freeText.some(term =>
      college.location.toLowerCase().includes(term)
    )

    if (cityMatch) {
      addReason('In a place you named', 8)
    } else if (targetStates.size === 0) {
      addReason('Outside the places you named', 8)
    }
  }

  const typeMatch = institutionTypeMatches(profile.preferredInstitutionType, college.degreesPredominant)
  if (typeMatch === true && profile.preferredInstitutionType && profile.preferredInstitutionType !== 'either') {
    const wantedType = institutionTypeLabel(profile.preferredInstitutionType)
    addReason(
      profile.preferredInstitutionType === 'two_year'
        ? `A ${wantedType} school, exactly what you're after`
        : `A ${wantedType} school, like you wanted`,
      30,
    )
  }
  if (typeMatch === false && profile.preferredInstitutionType && profile.preferredInstitutionType !== 'either') {
    const actualType = collegeInstitutionType(college.degreesPredominant)
    const wantedType = institutionTypeLabel(profile.preferredInstitutionType)
    if (actualType) {
      addReason(`It's a ${actualType} school; you're looking at ${wantedType}`, 30)
    }
  }

  if (profile.preferredSize) {
    if (college.size === profile.preferredSize) {
      addReason(`${formatSize(college.size)} campus, your speed`, 12)
    } else {
      addReason(sizeMismatchLabel(college.size, profile.preferredSize), 12)
    }
  }

  const matchedMajor = findMatchedMajor(college, profile)
  if (matchedMajor) {
    addReason(`Known for ${matchedMajor}`, 20)
  }

  if (profile.maxTuition != null) {
    const tuition = college.tuitionOutState ?? college.tuitionInState
    if (tuition != null) {
      if (tuition <= profile.maxTuition) {
        addReason('Under your budget', 10)
      } else {
        const overage = tuition - profile.maxTuition
        addReason('Above your budget', Math.min(30, 10 + Math.ceil(overage / 5000) * 4))
      }
    }
  }

  if (reasons.length === 0) {
    return ['Worth a look while Sage learns more about you']
  }

  return [...reasons]
    .sort((a, b) => b.weight - a.weight || a.order - b.order)
    .map(reason => reason.text)
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
  const expandedLocations = expandLocationTerms(profile.preferredLocations ?? [])
  const targetStates = new Set([
    ...preferredStates,
    ...expandedLocations.states,
  ])
  const preferredMajors = normalizeTerms([
    ...(profile.preferredMajors ?? []),
    profile.intendedMajor,
  ])
  const intendedMajor = normalizeTerms([profile.intendedMajor])
  const goals = normalizeTerms(profile.careerGoals ?? [])
  const collegeMajors = college.majors.map(m => m.toLowerCase())

  if (targetStates.size > 0) {
    score += targetStates.has(college.state.toUpperCase()) ? 24 : -12
  }

  if (expandedLocations.freeText.length > 0) {
    const cityMatch = expandedLocations.freeText.some(term =>
      college.location.toLowerCase().includes(term)
    )
    if (cityMatch) score += 8
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

  // Soften the ceiling: a hard clamp made every strong match tie at 100 and
  // erased the ordering between a 6-signal match and a 4-signal one. A logistic
  // curve keeps that ordering — more/better matches still score higher — while
  // only asymptotically approaching 100.
  const display = 100 / (1 + Math.exp(-(score - 70) / 18))
  return Math.max(1, Math.min(99, Math.round(display)))
}
