import { describe, expect, it } from 'vitest'
import {
  buildEmailPreview,
  EMAIL_TEMPLATE_IDS,
  emailTemplateCatalog,
} from '../../supabase/functions/_shared/email-preview-content'

describe('email preview catalog', () => {
  it('renders every production template from bounded sample data', () => {
    expect(emailTemplateCatalog().map(template => template.id)).toEqual(EMAIL_TEMPLATE_IDS)

    for (const id of EMAIL_TEMPLATE_IDS) {
      const preview = buildEmailPreview(id)
      expect(preview.subject.length).toBeGreaterThan(8)
      expect(preview.from).toMatch(/@youradmyt\.com>$/)
      expect(preview.html).toContain('<!doctype html>')
      expect(preview.text.length).toBeGreaterThan(80)
      expect(preview.html).not.toContain('{{')
    }
  })

  it('uses the same branded reminder renderer as the scheduled worker', () => {
    const reminder = buildEmailPreview('deadline_reminder')

    expect(reminder.subject).toContain('University of Oregon')
    expect(reminder.text).toContain('30 days away')
    expect(reminder.html).toContain('Confirm on the school’s site')
  })
})
