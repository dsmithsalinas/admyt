import { describe, expect, it } from 'vitest'
import { emailFingerprint } from '../../supabase/functions/_shared/email-fingerprint'

describe('emailFingerprint', () => {
  it('normalizes address casing and surrounding whitespace', async () => {
    const key = 'test-only-suppression-key'
    await expect(emailFingerprint(' Student@Example.com ', key)).resolves.toBe(
      await emailFingerprint('student@example.com', key),
    )
  })

  it('uses the secret key and returns a lowercase SHA-256 HMAC', async () => {
    const first = await emailFingerprint('student@example.com', 'first-key')
    const second = await emailFingerprint('student@example.com', 'second-key')

    expect(first).toMatch(/^[0-9a-f]{64}$/)
    expect(second).toMatch(/^[0-9a-f]{64}$/)
    expect(first).not.toBe(second)
  })
})
