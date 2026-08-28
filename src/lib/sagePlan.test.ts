import { describe, expect, it } from 'vitest'
import {
  calculatePlanProgress,
  applicationChecklistFromSchool,
  currentApplicationCycle,
  deadlineTasksFromSchools,
  financialAidChecklistForPlan,
  eventChecklistForPlan,
  filterTasksForFocus,
  suggestedEventQuestions,
  groupTasksForWeek,
  incompleteDependencyIds,
  nextTaskNeedingAttention,
  startOfWeekISO,
  type SagePlanTask,
} from './sagePlan'

function task(overrides: Partial<SagePlanTask> = {}): SagePlanTask {
  return {
    id: 'task-1',
    plan_id: 'plan-1',
    title: 'Draft essay',
    notes: null,
    category: 'essay',
    status: 'todo',
    priority: 'medium',
    owner_role: 'student',
    waiting_on: 'none',
    event_id: null,
    college_id: null,
    college_name: null,
    due_date: null,
    scheduled_week: null,
    source: 'manual',
    source_key: null,
    source_url: null,
    position: 0,
    completed_at: null,
    created_at: '2026-08-20T12:00:00.000Z',
    updated_at: '2026-08-20T12:00:00.000Z',
    ...overrides,
  }
}

describe('Sage Plan weekly loop', () => {
  const wednesday = new Date(2026, 7, 26, 12)

  it('uses a July-to-June application cycle', () => {
    expect(currentApplicationCycle(new Date(2026, 7, 26))).toBe('2026-2027')
    expect(currentApplicationCycle(new Date(2027, 0, 10))).toBe('2026-2027')
  })

  it('normalizes planned dates to Monday', () => {
    expect(startOfWeekISO(wednesday)).toBe('2026-08-24')
  })

  it('puts overdue and urgent work ahead of the current week', () => {
    const overdue = task({ id: 'overdue', due_date: '2026-08-25' })
    const urgent = task({ id: 'urgent', due_date: '2026-09-20', priority: 'urgent' })
    const thisWeek = task({ id: 'week', scheduled_week: '2026-08-24' })
    const later = task({ id: 'later', due_date: '2026-10-01' })
    const groups = groupTasksForWeek([later, thisWeek, urgent, overdue], wednesday)

    expect(groups.needsAttention.map(item => item.id)).toEqual(['overdue', 'urgent'])
    expect(groups.thisWeek.map(item => item.id)).toEqual(['week'])
    expect(groups.upNext.map(item => item.id)).toEqual(['later'])
    expect(nextTaskNeedingAttention([later, thisWeek, urgent, overdue], wednesday)?.id).toBe('overdue')
  })

  it('calculates progress and responsibility without counting skipped work', () => {
    const tasks = [
      task({ id: 'done', status: 'done', completed_at: '2026-08-25T12:00:00.000Z' }),
      task({ id: 'student', due_date: '2026-08-30' }),
      task({ id: 'parent', owner_role: 'parent', due_date: '2026-09-20' }),
      task({ id: 'skip', status: 'skipped' }),
    ]

    expect(calculatePlanProgress(tasks, wednesday)).toEqual({
      completed: 1,
      total: 3,
      percent: 33,
      dueSoon: 1,
      studentOpen: 1,
      parentOpen: 1,
    })
  })

  it('turns known school deadlines into stable imported tasks', () => {
    const imported = deadlineTasksFromSchools(
      'plan-1',
      [{ college_id: '110635', college_name: 'University of California, Berkeley' }],
      {
        '110635': {
          rounds: [{ type: 'Regular Decision', date: '2026-11-30' }],
          cycle: '2026-2027',
          source_url: 'https://admissions.berkeley.edu/apply-to-berkeley/dates-deadlines/',
        },
      },
      wednesday,
    )

    expect(imported).toHaveLength(1)
    expect(imported[0]).toMatchObject({
      title: 'Submit Regular Decision application',
      college_id: '110635',
      due_date: '2026-11-30',
      scheduled_week: '2026-11-30',
      source: 'college_deadline',
      source_key: 'deadline:plan-1:110635:Regular Decision:2026-11-30',
    })
  })

  it('builds a deadline-relative application checklist with a clear dependency chain', () => {
    const checklist = applicationChecklistFromSchool(
      'plan-1',
      { college_id: '1', college_name: 'Engineering College' },
      '2026-11-15',
      'Regular Decision',
    )

    expect(checklist).toHaveLength(10)
    expect(checklist.find(item => item.key === 'confirm_requirements')?.draft.due_date).toBe('2026-09-06')
    expect(checklist.find(item => item.key === 'final_review')?.dependsOn).toEqual([
      'create_account',
      'draft_essays',
      'review_fees',
      'confirm_documents',
    ])
    expect(checklist.find(item => item.key === 'verify_portal')?.draft).toMatchObject({
      due_date: '2026-11-18',
      waiting_on: 'school',
      source: 'application_checklist',
    })
  })

  it('builds shared and school-specific financial aid work without duplicating the household lane', () => {
    const checklist = financialAidChecklistForPlan('plan-1', {
      deadlineDate: '2027-02-01',
      schools: [{ college_id: '1', college_name: 'Engineering College' }],
    })

    expect(checklist).toHaveLength(11)
    expect(checklist.filter(item => !item.draft.college_id)).toHaveLength(8)
    expect(checklist.filter(item => item.draft.owner_role === 'parent')).toHaveLength(3)
    expect(checklist.find(item => item.key === 'submit_fafsa')).toMatchObject({
      dependsOn: [
        'student_fsa_account',
        'parent_fsa_account',
        'student_documents',
        'parent_documents',
        'school_codes',
      ],
      draft: {
        due_date: '2027-01-04',
        source: 'financial_aid_checklist',
        source_key: 'aid:plan-1:shared:submit_fafsa',
      },
    })
    expect(checklist.find(item => item.key === 'complete_1')).toMatchObject({
      dependsOn: ['submit_fafsa', 'forms_1'],
      draft: {
        due_date: '2027-01-25',
        college_name: 'Engineering College',
        waiting_on: 'school',
      },
    })
  })

  it('builds visit preparation around the event and assigns in-person logistics to a parent', () => {
    const checklist = eventChecklistForPlan('plan-1', 'event-1', {
      college_id: '1',
      college_name: 'Engineering College',
      event_type: 'campus_tour',
      format: 'in_person',
      starts_at: '2026-09-20T17:00:00.000Z',
      time_zone: 'America/Los_Angeles',
    }, wednesday)

    expect(checklist).toHaveLength(6)
    expect(checklist.find(item => item.key === 'logistics')?.draft).toMatchObject({
      owner_role: 'parent',
      event_id: 'event-1',
      source: 'visit_checklist',
    })
    expect(checklist.find(item => item.key === 'attend')?.dependsOn).toEqual(['logistics', 'questions'])
    expect(checklist.find(item => item.key === 'impressions')?.draft.due_date).toBe('2026-09-20')
  })

  it('adds interview preparation and follow-up without backdating near-term work', () => {
    const checklist = eventChecklistForPlan('plan-1', 'event-2', {
      college_id: '1',
      college_name: 'Engineering College',
      event_type: 'alumni_interview',
      format: 'virtual',
      starts_at: '2026-08-29T17:00:00.000Z',
      time_zone: 'America/Los_Angeles',
    }, wednesday)

    expect(checklist).toHaveLength(7)
    expect(checklist.find(item => item.key === 'confirm')?.draft.due_date).toBe('2026-08-26')
    expect(checklist.find(item => item.key === 'thank_you')).toMatchObject({
      dependsOn: ['attend'],
      draft: { due_date: '2026-08-30' },
    })
    expect(suggestedEventQuestions('alumni_interview')).toHaveLength(3)
  })

  it('reports only unfinished dependency blockers', () => {
    const tasks = [
      task({ id: 'draft' }),
      task({ id: 'review', title: 'Review application' }),
      task({ id: 'done', status: 'done', completed_at: '2026-08-25T12:00:00.000Z' }),
    ]
    const dependencies = [
      { task_id: 'review', depends_on_task_id: 'draft' },
      { task_id: 'review', depends_on_task_id: 'done' },
    ]

    expect(incompleteDependencyIds('review', dependencies, tasks)).toEqual(['draft'])
  })

  it('focuses work by responsibility, category, school, overdue state, and blockers', () => {
    const tasks = [
      task({ id: 'essay', owner_role: 'student', category: 'essay', college_id: '1', due_date: '2026-09-10' }),
      task({ id: 'aid', owner_role: 'parent', category: 'financial_aid', college_id: '1', due_date: '2026-08-20' }),
      task({ id: 'waiting', category: 'other', college_id: '2', waiting_on: 'counselor' }),
      task({ id: 'blocked', category: 'other', college_id: '1' }),
      task({ id: 'prerequisite', category: 'other', college_id: '1' }),
      task({ id: 'done', category: 'other', owner_role: 'parent', status: 'done', completed_at: '2026-08-25T12:00:00.000Z' }),
    ]
    const dependencies = [{ task_id: 'blocked', depends_on_task_id: 'prerequisite' }]

    expect(filterTasksForFocus(tasks, dependencies, 'parent', '', wednesday).map(item => item.id)).toEqual(['aid', 'done'])
    expect(filterTasksForFocus(tasks, dependencies, 'essays', '', wednesday).map(item => item.id)).toEqual(['essay'])
    expect(filterTasksForFocus(tasks, dependencies, 'financial_aid', '1', wednesday).map(item => item.id)).toEqual(['aid'])
    expect(filterTasksForFocus(tasks, dependencies, 'overdue', '', wednesday).map(item => item.id)).toEqual(['aid'])
    expect(filterTasksForFocus(tasks, dependencies, 'waiting', '', wednesday).map(item => item.id)).toEqual(['waiting', 'blocked'])
  })
})
