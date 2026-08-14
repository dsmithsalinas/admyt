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

test('Terms and Privacy Policy are public and signup requires acceptance', async ({ page }) => {
  await mockSupabase(page)

  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: 'The ground rules for using Admyt.' })).toBeVisible()
  await expect(page.getByText(/at least 13 years old/i)).toBeVisible()

  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'What Admyt knows, and why.' })).toBeVisible()
  await expect(page.getByText(/does not sell personal information/i).first()).toBeVisible()

  await page.goto('/profile')
  await page.getByRole('button', { name: 'Create a free account' }).click()
  const createButton = page.getByRole('button', { name: 'Create free account' })
  await page.getByPlaceholder('Email').fill('student@example.com')
  await page.getByPlaceholder('Password').fill('a-secure-test-password')
  await expect(createButton).toBeDisabled()
  await page.getByRole('checkbox').check()
  await expect(createButton).toBeEnabled()
})
