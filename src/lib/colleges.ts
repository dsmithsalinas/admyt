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

  const { data, error } = await supabase
    .from('colleges')
    .select('*')
    .order('enrollment', { ascending: false, nullsFirst: false })
    .limit(1000)

  if (error) {
    console.error('Failed to fetch colleges:', error.message)
    return []
  }

  cachedColleges = (data ?? []).map(mapRow)
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
