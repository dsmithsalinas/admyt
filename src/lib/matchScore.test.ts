import { describe, expect, it } from 'vitest'
import type { StudentProfile } from '@/context/ProfileContext'
import type { College } from './colleges'
import { explainFit, hasEnoughProfileForScore, scoreCollege } from './matchScore'

function college(overrides: Partial<College> = {}): College {
  return {
    id: '110635',
    name: 'Example University',
    location: 'Los Angeles, CA',
    state: 'CA',
    type: 'private',
    size: 'medium',
    degreesPredominant: 3,
    tuitionOutState: 40_000,
    majors: ['Computer Science', 'Psychology'],
    ...overrides,
  }
}

function profile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    preferredLocations: [],
    careerGoals: [],
    complete: true,
    ...overrides,
  }
}

describe('fit scoring', () => {
  it('does not claim a meaningful score without profile signals', () => {
    expect(hasEnoughProfileForScore(null)).toBe(false)
    expect(hasEnoughProfileForScore(profile())).toBe(false)
  })

  it('ranks a multi-signal match above a mismatch', () => {
    const student = profile({
      preferredStates: ['CA'],
      intendedMajor: 'Computer Science',
      preferredSize: 'medium',
      preferredInstitutionType: 'four_year',
      maxTuition: 50_000,
    })
    const matching = college()
    const mismatch = college({
      id: '999999',
      location: 'Boston, MA',
      state: 'MA',
      size: 'large',
      degreesPredominant: 2,
      tuitionOutState: 75_000,
      majors: ['History'],
    })

    expect(scoreCollege(matching, student)).toBeGreaterThan(scoreCollege(mismatch, student))
  })

  it('explains the strongest matching signals', () => {
    const reasons = explainFit(college(), profile({
      preferredStates: ['CA'],
      intendedMajor: 'Computer Science',
      maxTuition: 50_000,
    }))

    expect(reasons).toContain('In California, right in your region')
    expect(reasons).toContain('Known for Computer Science')
    expect(reasons).toContain('Under your budget')
  })

  it('keeps every displayed score within the documented range', () => {
    const result = scoreCollege(college(), profile({ preferredStates: ['CA'] }))
    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThanOrEqual(99)
  })
})
