import { describe, expect, it } from 'vitest'
import {
  createUnsubscribeToken,
  createUnsubscribeUrl,
  verifyUnsubscribeToken,
} from '../../supabase/functions/_shared/email-unsubscribe'

describe('email unsubscribe tokens', () => {
  const userId = '11111111-1111-4111-8111-111111111111'
  const secret = 'test-signing-secret-that-is-long-enough'

  it('round-trips a signed program-specific token', async () => {
    const token = await createUnsubscribeToken(userId, 'weekly_digest', secret)

    await expect(verifyUnsubscribeToken(token, secret)).resolves.toEqual({
      v: 1,
      userId,
      program: 'weekly_digest',
    })
  })

  it('rejects tampering and a different signing key', async () => {
    const token = await createUnsubscribeToken(userId, 'getting_started', secret)
    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`

    await expect(verifyUnsubscribeToken(tampered, secret)).resolves.toBeNull()
    await expect(verifyUnsubscribeToken(token, 'different-secret')).resolves.toBeNull()
  })

  it('builds an HTTPS endpoint URL without exposing the signing key', async () => {
    const url = await createUnsubscribeUrl(
      'https://example.supabase.co/functions/v1/email-unsubscribe',
      userId,
      'deadline_reminders',
      secret,
    )

    expect(url).toMatch(/^https:\/\/example\.supabase\.co\/functions\/v1\/email-unsubscribe\?token=/)
    expect(url).not.toContain(secret)
  })

  it('supports a program-specific Sage Plan opt-out', async () => {
    const token = await createUnsubscribeToken(userId, 'plan_reminders', secret)

    await expect(verifyUnsubscribeToken(token, secret)).resolves.toMatchObject({
      userId,
      program: 'plan_reminders',
    })
  })
})
