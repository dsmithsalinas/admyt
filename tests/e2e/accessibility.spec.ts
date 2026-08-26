import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const colleges = [
  {
    id: '1', name: 'Engineering College', location: 'Portland, OR', city: 'Portland', state: 'OR',
    type: 'private', size: 'small', degrees_predominant: 3, enrollment: 3000,
    acceptance_rate: 55, tuition_in_state: 42_000, tuition_out_state: 42_000,
    majors: ['Mechanical Engineering'],
  },
]

async function mockSupabase(page: Page) {
  await page.route('https://example.supabase.co/rest/v1/colleges**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'content-range': '0-0/1' },
    body: JSON.stringify(colleges),
  }))
  await page.route('https://example.supabase.co/rest/v1/data_source_status**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ last_refreshed_at: '2026-07-10T05:47:00.105148+00:00', record_count: 3881 }]),
  }))
}

async function expectNoMajorAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  const majorViolations = results.violations.filter(violation =>
    violation.impact === 'critical' || violation.impact === 'serious',
  )
  const summary = majorViolations.map(violation => ({
    id: violation.id,
    help: violation.help,
    nodes: violation.nodes.map(node => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary,
    })),
  }))
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([])
}

for (const route of ['/', '/chat', '/search', '/profile', '/data-and-privacy', '/terms', '/privacy', '/admin', '/admin/data-quality', '/admin/support', '/admin/incidents', '/admin/audit', '/email-operations']) {
  test(`${route} has no serious or critical automated accessibility violations`, async ({ page }) => {
    await mockSupabase(page)
    await page.goto(route)
    await page.locator('main, .premium-landing').first().waitFor()
    await expectNoMajorAccessibilityViolations(page)
  })
}

test('account modal has no serious or critical automated accessibility violations', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Create a free account' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForTimeout(250)
  await expectNoMajorAccessibilityViolations(page)
})

test('keyboard users can skip navigation and reach labelled Browse controls', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit on macOS follows the system full-keyboard-access setting.')
  await mockSupabase(page)
  await page.goto('/search')
  await expect(page.getByRole('heading', { name: /Browse with Sage beside you/i })).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()

  await expect(page.getByRole('textbox', { name: 'Search schools' })).toBeVisible()
  await page.getByRole('button', { name: 'More filters' }).click()
  await expect(page.getByRole('combobox', { name: 'State' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Major' })).toBeVisible()
  await expect(page.getByRole('slider', { name: /Max tuition/i })).toBeVisible()
})
