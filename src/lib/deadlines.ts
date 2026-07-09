import { supabase } from './supabase'

export interface DeadlineRound {
  type: string
  date: string // ISO YYYY-MM-DD
}

export interface CollegeDeadlines {
  rounds: DeadlineRound[]
  rolling?: boolean
  cycle?: string
  source_url?: string
}

// Asks the edge function to fetch + cache deadlines for a school. On a cache hit
// it returns instantly (no web search); otherwise it runs one web search, stores
// the result for everyone, and returns it.
export async function ensureDeadline(collegeId: string): Promise<CollegeDeadlines | null> {
  try {
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type: 'deadline', collegeId }),
    })
    if (!resp.ok) return null
    const data = await resp.json()
    return (data.deadlines as CollegeDeadlines) ?? null
  } catch {
    return null
  }
}

// Reads already-cached deadlines straight from the public table for many schools
// at once — cheap, no edge/Claude call. Used to render what's already known.
export async function getCachedDeadlines(collegeIds: string[]): Promise<Record<string, CollegeDeadlines>> {
  if (collegeIds.length === 0) return {}
  const { data } = await supabase
    .from('college_deadlines')
    .select('college_id,deadlines')
    .in('college_id', collegeIds)
  const map: Record<string, CollegeDeadlines> = {}
  for (const row of (data ?? []) as { college_id: string; deadlines: CollegeDeadlines }[]) {
    if (row.deadlines) map[row.college_id] = row.deadlines
  }
  return map
}

const ROUND_ABBREV: Record<string, string> = {
  'Early Decision': 'ED',
  'Early Decision II': 'ED II',
  'Early Action': 'EA',
  'Restrictive Early Action': 'REA',
  'Single-Choice Early Action': 'REA',
  'Regular Decision': 'RD',
  Priority: 'Priority',
  Transfer: 'Transfer',
}

export function roundLabel(type: string): string {
  return ROUND_ABBREV[type] ?? type
}

export function formatDeadlineDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export interface UpcomingDeadline {
  collegeId: string
  collegeName: string
  type: string
  date: string
  daysAway: number
  sourceUrl?: string
}

// Flattens every school's rounds into a single list of deadlines falling within
// the next `days` days, soonest first.
export function upcomingWithin(
  days: number,
  deadlinesByCollege: Record<string, CollegeDeadlines>,
  nameByCollege: Record<string, string>,
): UpcomingDeadline[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() + days)

  const out: UpcomingDeadline[] = []
  for (const [collegeId, d] of Object.entries(deadlinesByCollege)) {
    for (const r of d.rounds ?? []) {
      const dt = new Date(`${r.date}T00:00:00`)
      if (isNaN(dt.getTime())) continue
      if (dt >= now && dt <= cutoff) {
        out.push({
          collegeId,
          collegeName: nameByCollege[collegeId] ?? 'School',
          type: r.type,
          date: r.date,
          daysAway: Math.round((dt.getTime() - now.getTime()) / 86400000),
          sourceUrl: d.source_url,
        })
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}
