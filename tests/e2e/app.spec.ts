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

async function mockBugReportWidget(page: Page) {
  await page.route('https://hidustin-bug-intake.dusteallen.workers.dev/widget.js**', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: `
      const host = document.createElement('div')
      host.id = 'hidustin-bug-widget'
      document.body.appendChild(host)
      const root = host.attachShadow({ mode: 'open' })
      root.innerHTML = \`
        <style>
          .trigger { display: block; }
          .dialog { display: none; }
          .dialog.open { display: block; }
          input { font-size: 13px; }
        </style>
        <button class="trigger" type="button">Report a bug</button>
        <div class="dialog" role="dialog" aria-label="Report a bug">
          <label>What happened?<input type="text"></label>
        </div>
      \`
      const open = __name(() => {
        root.querySelector('.dialog').classList.add('open')
        root.querySelector('input').focus()
      }, 'open')
      root.querySelector('.trigger').addEventListener('click', open)
    `,
  }))
}

test('landing page reaches the Sage conversation', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Find where you fit.' })).toBeVisible()
  await page.getByRole('button', { name: /Start chatting with Sage/i }).first().click()
  await expect(page).toHaveURL(/\/chat$/)
  await expect(page.getByRole('heading', { name: 'Talk with Sage' })).toBeVisible()
})

test('bug reporting stays off the marketing page but remains available on desktop product routes', async ({ page }) => {
  await mockSupabase(page)
  await mockBugReportWidget(page)
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/')

  const trigger = page.locator('#hidustin-bug-widget .trigger')
  await expect(trigger).toBeHidden()

  await page.goto('/chat')
  await expect(trigger).toBeVisible()
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

test('email operations stays undisclosed to signed-out visitors', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/email-operations')
  await expect(page.getByRole('heading', { name: 'Not authorized' })).toBeVisible()
  await expect(page.getByText('You don’t have access to this page.')).toBeVisible()
  await expect(page.getByText('Email operations')).toHaveCount(0)
  await expect(page).toHaveTitle('Not authorized — admyt')

  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Not authorized' })).toBeVisible()
  await expect(page.getByText('System health')).toHaveCount(0)
  await expect(page).toHaveTitle('Not authorized — admyt')

  await page.goto('/admin/data-quality')
  await expect(page.getByRole('heading', { name: 'Not authorized' })).toBeVisible()
  await expect(page.getByText('College data')).toHaveCount(0)
  await expect(page).toHaveTitle('Not authorized — admyt')

  for (const route of ['/admin/support', '/admin/incidents', '/admin/audit']) {
    await page.goto(route)
    await expect(page.getByRole('heading', { name: 'Not authorized' })).toBeVisible()
    await expect(page).toHaveTitle('Not authorized — admyt')
  }
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

test('mobile Sage chat stays at the device width and does not trigger iOS focus zoom', async ({ page }) => {
  await mockSupabase(page)
  await mockBugReportWidget(page)
  await page.setViewportSize({ width: 390, height: 664 })
  await page.goto('/chat')

  const composer = page.getByRole('textbox', { name: 'Message Sage' })
  await expect(composer).toBeVisible()
  expect(await composer.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize)))
    .toBeGreaterThanOrEqual(16)

  const viewportMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }))
  expect(viewportMetrics.documentWidth).toBeLessThanOrEqual(viewportMetrics.clientWidth)
  expect(viewportMetrics.bodyWidth).toBeLessThanOrEqual(viewportMetrics.clientWidth)

  await composer.focus()
  await expect(composer).toBeFocused()
  await expect(page.locator('.mobile-tab-bar')).toBeInViewport()
  await expect(page.locator('#hidustin-bug-widget .trigger')).toBeHidden()
})

test('mobile bug reporting lives in Profile and its form does not trigger iOS focus zoom', async ({ page }) => {
  await mockSupabase(page)
  await mockBugReportWidget(page)
  await page.setViewportSize({ width: 390, height: 664 })
  await page.goto('/profile')

  await page.getByRole('button', { name: 'Report a bug' }).click()
  const dialog = page.locator('#hidustin-bug-widget').getByRole('dialog')
  await expect(dialog).toBeVisible()

  const summary = dialog.getByRole('textbox', { name: 'What happened?' })
  await expect(summary).toBeFocused()
  expect(await summary.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize)))
    .toBeGreaterThanOrEqual(16)
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
  const planSwitch = page.getByRole('switch', { name: 'Sage Plan reminders' })
  await planSwitch.click()
  await guidanceSwitch.click()
  await digestSwitch.click()

  await expect.poll(() => preferenceWrites.length).toBe(4)

  expect(preferenceWrites[0]).toMatchObject({
    user_id: userId,
    deadline_reminders_enabled: true,
  })
  expect(preferenceWrites[1]).toMatchObject({
    user_id: userId,
    plan_reminders_enabled: true,
    plan_reminders_opted_in_at: expect.any(String),
  })
  expect(preferenceWrites[2]).toMatchObject({
    user_id: userId,
    getting_started_enabled: true,
    getting_started_opted_in_at: expect.any(String),
  })
  expect(preferenceWrites[3]).toMatchObject({
    user_id: userId,
    weekly_digest_enabled: true,
    weekly_digest_opted_in_at: expect.any(String),
  })
  expect(preferenceWrites.every(write => typeof write.timezone === 'string')).toBe(true)
})

test('authorized operators can review system health from the admin overview', async ({ page }) => {
  await mockSupabase(page)
  const userId = '33333333-3333-4333-8333-333333333333'

  await page.addInitScript(({ id }) => {
    const user = {
      id,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'owner@example.com',
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
  await page.route('https://example.supabase.co/functions/v1/email-operations', async route => {
    expect(route.request().postDataJSON()).toEqual({ action: 'system_health' })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        admin: { email: 'owner@example.com' },
        generated_at: '2026-08-25T22:00:00Z',
        overall: { state: 'healthy', issue_count: 0 },
        ai_budget: { state: 'healthy', used: 18, limit: 100, remaining: 82, window_start: '2026-08-25T08:00:00Z' },
        catalog: {
          state: 'healthy', source: 'college_scorecard', provider: 'U.S. Department of Education College Scorecard',
          record_count: 3881, last_refreshed_at: '2026-07-10T05:47:00Z',
        },
        workers: {
          email_programs: { label: 'Guidance + digest', state: 'healthy', status: 'success', finished_at: '2026-08-25T21:00:00Z', sent_count: 2, failure_count: 0 },
          deadline_reminders: { label: 'Deadline reminders', state: 'healthy', status: 'success', finished_at: '2026-08-25T15:00:00Z', sent_count: 1, failure_count: 0 },
        },
        issues: [],
      }),
    })
  })

  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Everything in one calm view.' })).toBeVisible()
  await expect(page.getByText('All monitored systems look healthy.')).toBeVisible()
  await expect(page.getByText('18 of 100 requests')).toBeVisible()
  await expect(page.getByText('3,881 schools')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Email operations' })).toBeVisible()
})

test('authorized operators can review saved-school deadline quality', async ({ page }) => {
  await mockSupabase(page)
  const userId = '44444444-4444-4444-8444-444444444444'

  await page.addInitScript(({ id }) => {
    const user = {
      id,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'owner@example.com',
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
  await page.route('https://example.supabase.co/functions/v1/email-operations', async route => {
    const request = route.request().postDataJSON() as Record<string, unknown>
    if (request.action === 'deadline_preview') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ preview: {
        id: 'preview-1', college_id: '2', college_name: 'Liberal Arts University', expires_at: '2026-08-25T22:30:00Z',
        deadlines: { cycle: '2026–27', rounds: [{ type: 'Regular Decision', date: '2027-01-15' }], source_url: 'https://example.edu/admissions' },
      } }) })
      return
    }
    if (request.action === 'deadline_accept') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ updated: true }) })
      return
    }
    expect(request).toEqual({ action: 'data_quality' })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        admin: { email: 'owner@example.com' },
        generated_at: '2026-08-25T22:00:00Z',
        summary: { saved_school_records: 7, unique_saved_schools: 3, verified: 1, stale: 1, missing_source: 0, missing: 1 },
        catalog: {
          source: 'college_scorecard', provider: 'U.S. Department of Education College Scorecard',
          record_count: 3881, last_refreshed_at: '2026-07-10T05:47:00Z',
        },
        schools: [
          { college_id: '1', college_name: 'Engineering College', saved_count: 4, state: 'missing', updated_at: null, source_url: null, round_count: 0 },
          { college_id: '2', college_name: 'Liberal Arts University', saved_count: 2, state: 'stale', updated_at: '2026-08-01T10:00:00Z', source_url: 'https://example.edu/admissions', round_count: 2 },
        ],
      }),
    })
  })

  await page.goto('/admin/data-quality')
  await expect(page.getByRole('heading', { name: 'Deadline quality, without the digging.' })).toBeVisible()
  await expect(page.getByText('2 schools need attention')).toBeVisible()
  await expect(page.getByText('Engineering College')).toBeVisible()
  await page.getByRole('button', { name: 'Recheck', exact: true }).click()
  await expect(page.getByText('Liberal Arts University')).toBeVisible()
  await expect(page.getByText('Engineering College')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Official source' })).toHaveAttribute('href', 'https://example.edu/admissions')
  await page.getByRole('button', { name: 'Recheck Liberal Arts University' }).click()
  await expect(page.getByRole('heading', { name: 'Liberal Arts University' })).toBeVisible()
  await expect(page.getByText('2027-01-15')).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Accept checked data' }).click()
  await expect(page.getByText('Review before publishing')).toHaveCount(0)
})

test('authorized operators can use support, incident, and audit tools', async ({ page }) => {
  await mockSupabase(page)
  const userId = '55555555-5555-4555-8555-555555555555'
  await page.addInitScript(({ id }) => {
    const user = { id, aud: 'authenticated', role: 'authenticated', email: 'owner@example.com', app_metadata: {}, user_metadata: {}, identities: [], created_at: '2026-08-01T00:00:00.000Z' }
    localStorage.setItem('sb-example-auth-token', JSON.stringify({ access_token: 'test-access-token', refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user }))
  }, { id: userId })
  await page.route('https://example.supabase.co/rest/v1/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('https://example.supabase.co/functions/v1/email-operations', async route => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    if (body.action === 'admin_access') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ admin: { email: 'owner@example.com' } }) })
      return
    }
    if (body.action === 'support_lookup') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        found: true,
        user: { id: 'student-1', email: 'student@example.com', created_at: '2026-08-01T00:00:00Z', last_sign_in_at: '2026-08-25T20:00:00Z', email_confirmed_at: '2026-08-01T00:00:00Z' },
        counts: { messages: 12, saved_schools: 3, vibe_checks: 2 }, profile: { exists: true, updated_at: '2026-08-20T00:00:00Z' },
        email_preferences: { deadline_reminders_enabled: true, getting_started_enabled: false, weekly_digest_enabled: true, timezone: 'America/Los_Angeles', updated_at: '2026-08-20T00:00:00Z' },
        suppression: null, deliveries: [],
      }) })
      return
    }
    if (body.action === 'incident_controls') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        controls: [
          { key: 'welcome_email_enabled', enabled: true, updated_at: '2026-08-25T00:00:00Z' },
          { key: 'deadline_reminders_enabled', enabled: true, updated_at: '2026-08-25T00:00:00Z' },
          { key: 'email_programs_enabled', enabled: true, updated_at: '2026-08-25T00:00:00Z' },
        ],
        environment: { welcome_email_enabled: true, deadline_reminders_enabled: true, email_programs_enabled: true },
        maintenance: { maintenance_enabled: false, message: null, updated_at: '2026-08-25T00:00:00Z' },
      }) })
      return
    }
    if (body.action === 'audit_log') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ events: [{ id: 'event-1', admin_email: 'owner@example.com', action: 'support.lookup', target_type: 'user', target_id: 'student-1', outcome: 'success', created_at: '2026-08-25T22:00:00Z' }] }) })
      return
    }
    await route.fulfill({ status: 400, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/admin/support')
  await page.getByRole('textbox', { name: 'Account email' }).fill('student@example.com')
  await page.getByRole('button', { name: 'Look up' }).click()
  await expect(page.getByText('3', { exact: true })).toBeVisible()
  await expect(page.getByText('Message content stays private')).toHaveCount(0)

  await page.goto('/admin/incidents')
  await expect(page.getByRole('heading', { name: 'Pause safely. Communicate clearly.' })).toBeVisible()
  await expect(page.getByText('Server switch: enabled · Admin control: enabled').first()).toBeVisible()

  await page.goto('/admin/audit')
  await expect(page.getByText('support.lookup')).toBeVisible()
  await expect(page.getByText('student-1')).toBeVisible()
})

test('authorized operators can preview templates and send a test only to themselves', async ({ page }) => {
  await mockSupabase(page)
  const userId = '22222222-2222-4222-8222-222222222222'
  const actions: Array<Record<string, unknown>> = []

  await page.addInitScript(({ id }) => {
    const user = {
      id,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'owner@example.com',
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
  await page.route('https://example.supabase.co/functions/v1/email-operations', async route => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    actions.push(body)
    if (body.action === 'preview') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ preview: {
          id: body.template,
          name: 'Welcome',
          description: 'Preview',
          from: 'Sage from admyt <hello@youradmyt.com>',
          subject: 'You’re in. Let’s find where you fit.',
          html: '<!doctype html><html><body><h1>Preview ready</h1></body></html>',
          text: 'Preview ready',
        } }),
      })
      return
    }
    if (body.action === 'send_test') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sent: true, recipient: 'owner@example.com' }) })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        admin: { email: 'owner@example.com' },
        templates: [
          { id: 'welcome', name: 'Welcome', description: 'The one-time welcome.' },
          { id: 'weekly_digest', name: 'Weekly digest', description: 'Monday snapshot.' },
        ],
        summary: {
          opted_in: { deadline_reminders: 2, plan_reminders: 1, getting_started: 3, weekly_digest: 4 },
          suppressions: { total: 1, by_reason: { bounce: 1, complaint: 0, provider_suppression: 0, manual: 0 } },
          last_24_hours: {
            delivery_status: { pending: 0, sent: 5, failed: 0 },
            provider_status: { delivered: 5, bounced: 0, complained: 0, suppressed: 0 },
          },
        },
        runs: [{ worker: 'email_programs', status: 'success', metrics: { sent_count: 2, failure_count: 0 }, error_code: null, finished_at: '2026-08-25T19:00:00Z', duration_ms: 412 }],
        deliveries: [{ kind: 'weekly_digest', status: 'sent', provider_status: 'delivered', error_code: null, sent_at: '2026-08-25T19:00:00Z', created_at: '2026-08-25T19:00:00Z' }],
        events: [{ event_type: 'email.delivered', occurred_at: '2026-08-25T19:01:00Z', received_at: '2026-08-25T19:01:01Z' }],
        suppressions: [],
      }),
    })
  })

  await page.goto('/email-operations')
  await expect(page.getByRole('heading', { name: 'Email operations' })).toBeVisible()
  await expect(page.getByText('Sent · 24 hours')).toBeVisible()
  await expect(page.frameLocator('iframe[title="Welcome email preview"]').getByRole('heading', { name: 'Preview ready' })).toBeVisible()
  await page.getByRole('button', { name: 'Send test to me' }).click()
  await expect(page.getByText('Test sent to owner@example.com.')).toBeVisible()
  expect(actions).toContainEqual({ action: 'send_test', template: 'welcome' })
})
