import { expect, test, type Page } from '@playwright/test'

const colleges = [
  {
    id: '1', name: 'Engineering College', location: 'Portland, OR', city: 'Portland', state: 'OR',
    type: 'private', size: 'small', degrees_predominant: 3, enrollment: 3000,
    acceptance_rate: 55, tuition_in_state: 42_000, tuition_out_state: 42_000,
    majors: ['Mechanical Engineering'],
  },
  {
    id: '2', name: 'Liberal Arts University', location: 'Salem, OR', city: 'Salem', state: 'OR',
    type: 'public', size: 'medium', degrees_predominant: 3, enrollment: 8000,
    acceptance_rate: 70, tuition_in_state: 15_000, tuition_out_state: 35_000,
    majors: ['English Literature'],
  },
]

async function mockSupabase(page: Page) {
  await page.route('https://example.supabase.co/rest/v1/colleges**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'content-range': `0-${colleges.length - 1}/${colleges.length}` },
    body: JSON.stringify(colleges),
  }))
  await page.route('https://example.supabase.co/rest/v1/data_source_status**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{
      last_refreshed_at: '2026-07-10T05:47:00.105148+00:00',
      record_count: 3881,
    }]),
  }))
}

test('landing page reaches the Sage conversation', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Find where you fit.' })).toBeVisible()
  await page.getByRole('button', { name: /Start chatting with Sage/i }).first().click()
  await expect(page).toHaveURL(/\/chat$/)
  await expect(page.getByRole('heading', { name: /Let.s find your place/i })).toBeVisible()
})

test('Browse deep links work and text search includes majors', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/search')
  await expect(page.getByRole('heading', { name: /Browse with Sage beside you/i })).toBeVisible()
  await page.getByPlaceholder(/Search by school name/i).fill('mechanical')
  await expect(page.getByRole('button', { name: 'Engineering College' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Liberal Arts University' })).toHaveCount(0)
})

test('data and privacy disclosures are reachable without signing in', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/data-and-privacy')
  await expect(page.getByRole('heading', { name: 'Your data, in plain English.' })).toBeVisible()
  await expect(page.getByText(/not an admissions prediction/i)).toBeVisible()
  await expect(page.getByText(/3,881 schools/i)).toBeVisible()
})

test('Terms and Privacy Policy are public and passwordless signup requires acceptance', async ({ page }) => {
  await mockSupabase(page)
  let otpRequestedFor: string | null = null
  await page.route('https://example.supabase.co/auth/v1/otp', async route => {
    const requestBody = route.request().postDataJSON() as { email?: string }
    otpRequestedFor = requestBody.email ?? null
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  })

  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: 'The ground rules for using Admyt.' })).toBeVisible()
  await expect(page.getByText(/at least 13 years old/i)).toBeVisible()

  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'What Admyt knows, and why.' })).toBeVisible()
  await expect(page.getByText(/does not sell personal information/i).first()).toBeVisible()

  await page.goto('/profile')
  await page.getByRole('button', { name: 'Create a free account' }).click()
  const emailButton = page.getByRole('button', { name: 'Continue with email' })
  await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeEnabled()
  await page.getByPlaceholder('Email').fill('student@example.com')
  await expect(emailButton).toBeEnabled()
  await emailButton.click()
  await expect(page.getByText(/check the box to agree/i)).toBeVisible()
  await expect(page.getByRole('checkbox')).toBeFocused()
  await page.getByRole('checkbox').check()
  await expect(emailButton).toBeEnabled()

  await emailButton.click()
  await expect(page.getByText(/sent a six-digit code/i)).toBeVisible()
  await expect(page.getByLabel('Six-digit code')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled()
  await page.getByLabel('Six-digit code').fill('123456')
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled()
  expect(otpRequestedFor).toBe('student@example.com')
})

test('auth modal stays below the viewport edge at short desktop heights', async ({ page }) => {
  await mockSupabase(page)
  await page.setViewportSize({ width: 800, height: 500 })
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Create a free account' }).click()

  const panel = page.locator('.admyt-modal-panel')
  await expect(panel).toBeFocused()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).not.toBeFocused()
  expect(await panel.evaluate(element => element.scrollTop)).toBe(0)
  const panelBox = await panel.boundingBox()
  expect(panelBox?.y).toBeGreaterThanOrEqual(35)
  await expect(page.getByRole('heading', { name: 'Find where you fit' })).toBeInViewport()
  await page.getByPlaceholder('Email').fill('student@example.com')
  await page.getByRole('button', { name: 'Continue with email' }).click()
  await expect(page.getByRole('checkbox')).toBeInViewport()
  const panelAfterConsentPrompt = await panel.boundingBox()
  expect(panelAfterConsentPrompt?.height).toBeGreaterThan(300)
})

test('header login opens as a full-page modal above the Sage interface', async ({ page }) => {
  await mockSupabase(page)
  await page.setViewportSize({ width: 800, height: 500 })
  await page.goto('/chat')
  await page.getByRole('button', { name: 'Profile' }).click()

  const overlay = page.locator('body > .auth-modal-overlay')
  await expect(overlay).toHaveCount(1)
  const overlayBox = await overlay.boundingBox()
  expect(overlayBox).toEqual({ x: 0, y: 0, width: 800, height: 500 })

  const panel = overlay.locator('.admyt-modal-panel')
  await expect(panel).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Find where you fit' })).toBeInViewport()
  expect(await panel.evaluate(element => element.scrollTop)).toBe(0)
})

test('signed-in students control each optional email program independently', async ({ page }) => {
  await mockSupabase(page)
  const userId = '11111111-1111-4111-8111-111111111111'
  const preferenceWrites: Record<string, unknown>[] = []

  await page.addInitScript(({ id }) => {
    const user = {
      id,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'student@example.com',
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: '2026-08-01T00:00:00.000Z',
    }
    localStorage.setItem('sb-example-auth-token', JSON.stringify({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    }))
  }, { id: userId })

  await page.route('https://example.supabase.co/rest/v1/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
  await page.route('https://example.supabase.co/rest/v1/user_preferences**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      user_id: userId,
      preferred_states: [],
      max_tuition: null,
      preferred_majors: [],
      sage_profile: null,
    }),
  }))
  await page.route('https://example.supabase.co/rest/v1/notification_preferences**', async route => {
    if (route.request().method() === 'POST') {
      preferenceWrites.push(route.request().postDataJSON() as Record<string, unknown>)
      await route.fulfill({ status: 201, contentType: 'application/json', body: '[]' })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
  await page.goto('/profile')
  const reminderSwitch = page.getByRole('switch', { name: 'Deadline reminders' })
  await expect(reminderSwitch).toHaveAttribute('aria-checked', 'false')
  await expect(reminderSwitch).toBeEnabled()
  await reminderSwitch.click()
  await expect(reminderSwitch).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText(/email choices are up to date/i)).toBeVisible()

  const guidanceSwitch = page.getByRole('switch', { name: 'Getting-started guidance' })
  const digestSwitch = page.getByRole('switch', { name: 'Weekly My Schools digest' })
  await guidanceSwitch.click()
  await digestSwitch.click()

  expect(preferenceWrites[0]).toMatchObject({
    user_id: userId,
    deadline_reminders_enabled: true,
  })
  expect(preferenceWrites[1]).toMatchObject({
    user_id: userId,
    getting_started_enabled: true,
    getting_started_opted_in_at: expect.any(String),
  })
  expect(preferenceWrites[2]).toMatchObject({
    user_id: userId,
    weekly_digest_enabled: true,
    weekly_digest_opted_in_at: expect.any(String),
  })
  expect(preferenceWrites.every(write => typeof write.timezone === 'string')).toBe(true)
})
