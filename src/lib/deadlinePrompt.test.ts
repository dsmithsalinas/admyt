import { describe, expect, it } from 'vitest'
import { buildDeadlinePrompt, type College } from '../../supabase/functions/chat/prompt'

const college: College = {
  id: '145637',
  name: 'University of Illinois Urbana-Champaign',
  location: 'Champaign, IL',
  type: 'public',
  size: 'large',
  majors: [],
}

describe('deadline research prompt', () => {
  it('resolves yearless official deadlines to their next calendar occurrence', () => {
    const { userMessage } = buildDeadlinePrompt(college, '2026-08-25')

    expect(userMessage).toContain('use the current year when that month and day is today or has not yet occurred this year')
    expect(userMessage).toContain('otherwise use the next year')
    expect(userMessage).toContain('"November 1" becomes 2026-11-01')
    expect(userMessage).toContain('"January 5" becomes 2027-01-05')
  })

  it('keeps the inference limited to current official pages', () => {
    const { userMessage } = buildDeadlinePrompt(college, '2026-08-25')

    expect(userMessage).toContain('Do not apply it to an archived page')
    expect(userMessage).toContain('or override a year or cycle explicitly stated by the school')
  })
})
