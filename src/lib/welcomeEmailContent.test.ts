import { describe, expect, it } from 'vitest'
import { welcomeEmailContent } from '../../supabase/functions/_shared/welcome-email-content'

describe('welcomeEmailContent', () => {
  it('gives a new student three clear, branded ways to start', () => {
    const content = welcomeEmailContent()

    expect(content.subject).toBe('You’re in. Let’s find where you fit.')
    expect(content.text).toContain('Tell me what matters')
    expect(content.text).toContain('Save your first school')
    expect(content.text).toContain('Run a Vibe Check')
    expect(content.text).toContain('https://youradmyt.com/chat')
    expect(content.html).toContain('Talk with Sage')
    expect(content.html).not.toContain('{{')
  })
})
