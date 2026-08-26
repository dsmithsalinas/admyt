import { describe, expect, it } from 'vitest'
import {
  guidanceEmailContent,
  weeklyDigestEmailContent,
} from '../../supabase/functions/_shared/email-program-content'

describe('guidanceEmailContent', () => {
  it('builds three distinct, bounded guidance steps', () => {
    const unsubscribeUrl = 'https://example.supabase.co/functions/v1/email-unsubscribe?token=signed'
    const first = guidanceEmailContent(1, { savedSchoolCount: 0, vibeCheckCount: 0 }, unsubscribeUrl)
    const second = guidanceEmailContent(2, { savedSchoolCount: 2, vibeCheckCount: 0 })
    const third = guidanceEmailContent(3, { savedSchoolCount: 2, vibeCheckCount: 1 })

    expect(first.text).toContain('Talk with Sage')
    expect(first.text).toContain(`Unsubscribe: ${unsubscribeUrl}`)
    expect(first.html).toContain('>Unsubscribe</a>')
    expect(second.text).toContain('You’ve saved 2 schools')
    expect(third.text).toContain('You’ve run 1 Vibe Check')
    expect(new Set([first.subject, second.subject, third.subject]).size).toBe(3)
  })
})

describe('weeklyDigestEmailContent', () => {
  it('summarizes schools, Vibe Checks, and verified dates without trusting HTML input', () => {
    const unsubscribeUrl = 'https://example.supabase.co/functions/v1/email-unsubscribe?token=signed'
    const digest = weeklyDigestEmailContent({
      schools: [
        { id: '100', name: 'North & West <College>', vibeScore: 84 },
        { id: '200', name: 'City University' },
      ],
      totalSchoolCount: 2,
      deadlines: [{
        collegeName: 'North & West <College>',
        type: 'Early Action',
        date: '2026-11-01',
        sourceUrl: 'https://example.edu/admissions',
      }],
    }, unsubscribeUrl)

    expect(digest.subject).toBe('Your week with My Schools: 2 schools')
    expect(digest.text).toContain('Vibe Check: 84/100')
    expect(digest.text).toContain('Early Action')
    expect(digest.text).toContain(`Unsubscribe: ${unsubscribeUrl}`)
    expect(digest.html).toContain('North &amp; West &lt;College&gt;')
    expect(digest.html).not.toContain('North & West <College>')
  })
})
