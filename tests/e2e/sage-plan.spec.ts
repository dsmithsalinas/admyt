import { expect, test } from '@playwright/test'

const userId = '66666666-6666-4666-8666-666666666666'
const plan = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  user_id: userId,
  name: 'My application plan',
  application_cycle: '2026-2027',
  status: 'active',
  tier: 'free',
  last_weekly_planned_for: null,
  created_at: '2026-08-20T12:00:00.000Z',
  updated_at: '2026-08-20T12:00:00.000Z',
}

const task = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  plan_id: plan.id,
  title: 'Draft the community essay',
  notes: null,
  category: 'essay',
  status: 'todo',
  priority: 'high',
  owner_role: 'student',
  waiting_on: 'none',
  event_id: null,
  college_id: '1',
  college_name: 'Engineering College',
  due_date: '2026-09-10',
  scheduled_week: '2026-08-24',
  source: 'manual',
  source_key: null,
  source_url: null,
  position: 0,
  completed_at: null,
  created_at: '2026-08-20T12:00:00.000Z',
  updated_at: '2026-08-20T12:00:00.000Z',
}

const aidTask = {
  ...task,
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  title: 'Gather the parent income and asset details',
  category: 'financial_aid',
  owner_role: 'parent',
  college_id: null,
  college_name: null,
  due_date: '2026-09-15',
  scheduled_week: '2026-09-14',
  source: 'financial_aid_checklist',
  source_key: `aid:${plan.id}:shared:parent_documents`,
}

const planEvent = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  plan_id: plan.id,
  college_id: '1',
  college_name: 'Engineering College',
  event_type: 'campus_tour',
  format: 'in_person',
  starts_at: '2026-09-20T17:00:00.000Z',
  time_zone: 'America/Los_Angeles',
  location: 'Admissions Center',
  registration_url: 'https://example.edu/visit',
  questions: ['What do students do on weekends?'],
  notes: null,
  status: 'scheduled',
  created_at: '2026-08-28T12:00:00.000Z',
  updated_at: '2026-08-28T12:00:00.000Z',
}

test('signed-in students can review and hand off weekly work', async ({ page }) => {
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
    const session = JSON.stringify({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    })
    // Keep the test deterministic whether Playwright starts its configured
    // example server or reuses a developer's linked local Vite server.
    localStorage.setItem('sb-example-auth-token', session)
    localStorage.setItem('sb-bwegkzzeiasdbuwatglc-auth-token', session)
  }, { id: userId })

  let owner = 'student'
  await page.route('**/rest/v1/**', async route => {
    const url = new URL(route.request().url())
    const table = url.pathname.split('/').pop()
    if (table === 'sage_plans') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plan) })
      return
    }
    if (table === 'hearted_schools') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ college_id: '1', college_name: 'Engineering College' }]) })
      return
    }
    if (table === 'college_deadlines') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ college_id: '1', deadlines: { rounds: [{ type: 'Regular Decision', date: '2026-11-15' }], source_url: 'https://example.edu/admissions' } }]) })
      return
    }
    if (table === 'sage_plan_tasks') {
      if (route.request().method() === 'PATCH') {
        const update = route.request().postDataJSON() as Record<string, unknown>
        owner = String(update.owner_role ?? owner)
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...task, ...update, owner_role: owner }) })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ ...task, owner_role: owner }, aidTask]) })
      return
    }
    if (table === 'sage_plan_task_dependencies') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }
    if (table === 'sage_plan_events') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([planEvent]) })
      return
    }
    if (table === 'sage_plan_colleges') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          plan_id: plan.id,
          college_id: '1',
          college_name: 'Engineering College',
          stage: 'applying',
          application_round: 'Regular Decision',
          target_deadline: '2026-11-15',
          created_at: '2026-08-20T12:00:00.000Z',
          updated_at: '2026-08-20T12:00:00.000Z',
        }]),
      })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })

  await page.goto('/plan')
  await expect(page.getByRole('heading', { name: 'Your week, minus the chaos.' })).toBeVisible()
  await expect(page.locator('.plan-task-title').getByText('Draft the community essay')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Plan my week' })).toBeVisible()
  await expect(page.getByLabel('Engineering College application stage')).toHaveValue('applying')
  await expect(page.getByRole('heading', { name: 'Financial aid' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Visits & interviews' })).toBeVisible()

  const focusModes = page.locator('.plan-focus-pills')
  await focusModes.getByRole('button', { name: /Parent/ }).click()
  await expect(page.locator('.plan-task-title').getByText('Draft the community essay')).not.toBeVisible()
  await expect(page.locator('.plan-task-title').getByText('Gather the parent income and asset details')).toBeVisible()
  await expect(page.locator('.plan-hero-action strong')).toHaveText('Gather the parent income and asset details')
  await page.getByLabel('Focus by school').selectOption('1')
  await expect(page.getByRole('heading', { name: 'Nothing needs attention here.' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear focus' }).click()
  await expect(page.locator('.plan-task-title').getByText('Draft the community essay')).toBeVisible()

  await page.getByRole('button', { name: /Campus tour Engineering College/ }).click()
  await expect(page.getByRole('heading', { name: 'Engineering College' })).toBeVisible()
  await expect(page.getByLabel('Questions to ask')).toHaveValue('What do students do on weekends?')
  await expect(page.getByText('Admissions Center')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Add visit or interview' }).click()
  await expect(page.getByRole('heading', { name: 'Put the event on the plan' })).toBeVisible()
  await page.getByLabel('Date').fill('2026-09-20')
  await expect(page.getByText('Confirm travel, parking, and arrival details')).toBeVisible()
  await expect(page.getByText('6 tasks, ready for the weekly plan.')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Review aid checklist' }).click()
  await expect(page.getByRole('heading', { name: 'Your financial aid checklist' })).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('button', { name: /^Gather the parent income and asset details Due/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Make the money steps visible' })).not.toBeVisible()
  await page.getByRole('button', { name: 'Add or refresh steps' }).click()
  await expect(page.getByRole('heading', { name: 'Make the money steps visible' })).toBeVisible()
  await page.getByLabel('Earliest financial aid deadline').fill('2027-02-01')
  await expect(page.getByText('Complete and submit the FAFSA')).toBeVisible()
  await expect(page.getByText('11', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  const essayRow = page.locator('article.plan-task-row').filter({ hasText: 'Draft the community essay' })
  await essayRow.getByRole('button', { name: 'Assigned to Student. Hand off to Parent' }).click()
  await expect(essayRow.getByRole('button', { name: 'Assigned to Parent. Hand off to Student' })).toBeVisible()
  expect(owner).toBe('parent')

  await essayRow.locator('.plan-task-main').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Keep the plan current' })).toBeVisible()
  await expect(page.getByLabel('Owner')).toHaveValue('parent')
})
