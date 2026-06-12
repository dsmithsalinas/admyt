import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY
const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools'

const FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.zip',
  'school.school_url',
  'school.locale',
  'school.ownership',
  'school.institution_level',
  'school.operating',
  'latest.student.size',
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.average.overall',
  'latest.admissions.act_scores.midpoint.cumulative',
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.completion.rate_suppressed.overall',
  'latest.programs.cip_4_digit',
].join(',')

function getSize(enrollment) {
  if (!enrollment) return 'medium'
  if (enrollment < 5000) return 'small'
  if (enrollment < 15000) return 'medium'
  return 'large'
}

function getType(ownership) {
  if (ownership === 1) return 'public'
  if (ownership === 2) return 'private'
  return 'private_np'
}

function getMajors(programs) {
  if (!programs || !Array.isArray(programs)) return []
  const seen = new Set()
  return programs
    .filter(p => p?.title && p?.code)
    .map(p => {
      const title = p.title
        .replace(/,.*$/, '')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim()
      return title
    })
    .filter(title => {
      if (seen.has(title)) return false
      seen.add(title)
      return true
    })
    .slice(0, 10)
}

async function fetchPage(page, perPage = 100) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    fields: FIELDS,
    per_page: perPage,
    page,
    'school.operating': 1,
    _sort: 'latest.student.size:desc',
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

async function run() {
  console.log('Fetching colleges from College Scorecard API...')

  const allColleges = []
  const perPage = 100
  const targetCount = 1000
  const pages = Math.ceil(targetCount / perPage)

  for (let page = 0; page < pages; page++) {
    console.log(`Fetching page ${page + 1} of ${pages}...`)
    const data = await fetchPage(page, perPage)
    const results = data?.results ?? []
    if (results.length === 0) break

    for (const r of results) {
      const name = r['school.name']
      const state = r['school.state']
      if (!name || !state) continue

      const city = r['school.city'] ?? ''
      const enrollment = r['latest.student.size']
      const acceptanceRate = r['latest.admissions.admission_rate.overall']
      const tuitionIn = r['latest.cost.tuition.in_state']
      const tuitionOut = r['latest.cost.tuition.out_of_state']

      allColleges.push({
        id: String(r.id),
        name,
        location: city ? `${city}, ${state}` : state,
        city,
        state,
        zip: r['school.zip'] ?? null,
        url: r['school.school_url'] ?? null,
        locale: String(r['school.locale'] ?? ''),
        type: getType(r['school.ownership']),
        size: getSize(enrollment),
        enrollment: enrollment ?? null,
        acceptance_rate: acceptanceRate != null
          ? Math.round(acceptanceRate * 100)
          : null,
        avg_sat: r['latest.admissions.sat_scores.average.overall'] ?? null,
        avg_act: r['latest.admissions.act_scores.midpoint.cumulative'] ?? null,
        avg_gpa: null,
        tuition_in_state: tuitionIn ?? null,
        tuition_out_state: tuitionOut ?? null,
        graduation_rate: r['latest.completion.rate_suppressed.overall'] != null
          ? Math.round(r['latest.completion.rate_suppressed.overall'] * 100)
          : null,
        description: null,
        majors: getMajors(r['latest.programs.cip_4_digit']),
      })
    }

    // Small delay to be kind to the API
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`Fetched ${allColleges.length} colleges. Inserting into Supabase...`)

  // Upsert in batches of 100
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < allColleges.length; i += batchSize) {
    const batch = allColleges.slice(i, i + batchSize)
    const { error } = await supabase
      .from('colleges')
      .upsert(batch, { onConflict: 'id' })

    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error.message)
    } else {
      inserted += batch.length
      console.log(`Inserted ${inserted} / ${allColleges.length}...`)
    }
  }

  console.log(`Done. ${inserted} colleges loaded into Supabase.`)
}

run().catch(console.error)
