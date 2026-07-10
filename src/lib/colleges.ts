import { supabase } from './supabase'

export interface College {
  id: string
  name: string
  location: string
  city?: string
  state: string
  zip?: string
  url?: string
  locale?: string
  type: 'public' | 'private' | 'private_np'
  degreesPredominant?: number
  size: 'small' | 'medium' | 'large'
  enrollment?: number
  acceptanceRate?: number
  avgGpa?: number
  avgSat?: number
  avgAct?: number
  tuitionInState?: number
  tuitionOutState?: number
  graduationRate?: number
  description?: string
  majors: string[]
}

function mapRow(row: Record<string, unknown>): College {
  return {
    id: String(row.id),
    name: String(row.name),
    location: String(row.location ?? ''),
    city: row.city as string | undefined,
    state: String(row.state ?? ''),
    zip: row.zip as string | undefined,
    url: row.url as string | undefined,
    locale: row.locale as string | undefined,
    type: (row.type as College['type']) ?? 'private',
    degreesPredominant: row.degrees_predominant as number | undefined,
    size: (row.size as College['size']) ?? 'medium',
    enrollment: row.enrollment as number | undefined,
    acceptanceRate: row.acceptance_rate as number | undefined,
    avgGpa: row.avg_gpa as number | undefined,
    avgSat: row.avg_sat as number | undefined,
    avgAct: row.avg_act as number | undefined,
    tuitionInState: row.tuition_in_state as number | undefined,
    tuitionOutState: row.tuition_out_state as number | undefined,
    graduationRate: row.graduation_rate as number | undefined,
    description: row.description as string | undefined,
    majors: (row.majors as string[]) ?? [],
  }
}

let cachedColleges: College[] | null = null

export async function getColleges(): Promise<College[]> {
  if (cachedColleges) return cachedColleges

  const pageSize = 1000
  const colleges: College[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('Failed to fetch colleges:', error.message)
      break
    }

    const page = (data ?? []).map(mapRow)
    colleges.push(...page)

    if (page.length < pageSize) break
    from += pageSize
  }

  cachedColleges = colleges
  return cachedColleges
}

export async function getCollege(id: string): Promise<College | null> {
  if (cachedColleges) {
    return cachedColleges.find(c => c.id === id) ?? null
  }

  const { data, error } = await supabase
    .from('colleges')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapRow(data)
}

export function clearCollegeCache() {
  cachedColleges = null
}

// Human label for a school's ownership type. `private_np` is College Scorecard
// ownership 3 — private FOR-PROFIT — so surface that rather than calling it
// "Private" like the nonprofits.
export function typeLabel(type: College['type']): string {
  if (type === 'public') return 'Public'
  if (type === 'private_np') return 'For-profit'
  return 'Private'
}

export function getShortName(name: string): string {
  let s = name

  // Specific multi-word prefixes first
  s = s.replace(/^The University of /, 'U of ')
  // UC campuses before the generic "University of" rule, or the hyphen truncation
  // below collapses every campus (UCLA, Berkeley, San Diego…) to "U of California".
  s = s.replace(/^University of California[-,]\s*/, 'UC ')
  s = s.replace(/^University of /, 'U of ')
  s = s.replace(/^California State Polytechnic University[- ]/, 'Cal Poly ')
  s = s.replace(/^California State University[- ]/, 'Cal State ')

  // "X University at Y" → "X Y" (e.g. "State University of New York at Albany" already handled above)
  const atMatch = s.match(/^(.+?) University at (.+)$/)
  if (atMatch) s = `${atMatch[1]} ${atMatch[2]}`

  // Strip trailing ", The"
  s = s.replace(/, The$/, '')

  // Truncate at first comma or hyphen if still long
  const commaIdx = s.indexOf(',')
  if (commaIdx > 0) s = s.slice(0, commaIdx)

  const hyphenIdx = s.indexOf('-')
  if (hyphenIdx > 4) s = s.slice(0, hyphenIdx)

  // Hard cap at 24 chars with ellipsis
  if (s.length > 24) s = s.slice(0, 22) + '…'

  return s.trim()
}
