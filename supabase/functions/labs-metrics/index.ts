import { createClient } from 'npm:@supabase/supabase-js@2.39.0'

const EXPECTED_TOKEN_HASH = '6419e03090fd9eae683e90674ea757e076a056fa690d581f78b1825c773b1782'
const DAY = 86_400_000

Deno.serve(async (request) => {
  if (request.method !== 'GET') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  if (!(await tokenMatches(request.headers.get('x-labs-token') ?? ''))) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const started = Date.now()
  try {
    const admin = createAdminClient()
    const now = new Date()
    const since7d = new Date(now.getTime() - 7 * DAY).toISOString()
    const since14d = new Date(now.getTime() - 14 * DAY).toISOString()
    const since28d = new Date(now.getTime() - 28 * DAY).toISOString()
    const [users, chats, hearts, vibes, deliveries, deliveryEvents] = await Promise.all([
      loadUsers(admin),
      loadRows(admin, 'chat_messages', 'user_id,role,created_at', since28d),
      loadRows(admin, 'hearted_schools', 'user_id,created_at', since28d),
      loadRows(admin, 'saved_vibes', 'user_id,created_at', since28d),
      loadRows(admin, 'notification_deliveries', 'status,created_at,sent_at,provider_status', since28d),
      loadRows(admin, 'email_delivery_events', 'event_type,occurred_at', since28d, 'occurred_at'),
    ])

    const current = [...chats, ...hearts, ...vibes].filter((row) => row.created_at >= since7d)
    const prior = [...chats, ...hearts, ...vibes].filter((row) => row.created_at >= since14d && row.created_at < since7d)
    const currentStudents = unique(current.map((row) => row.user_id))
    const priorStudents = unique(prior.map((row) => row.user_id))
    const activatedCurrent = unique([...hearts, ...vibes].filter((row) => row.created_at >= since7d).map((row) => row.user_id))
    const eligible28d = users.filter((user) => user.created_at >= since28d)
    const activated28dIds = unique([...hearts, ...vibes].map((row) => row.user_id))
    const activated28d = eligible28d.filter((user) => activated28dIds.has(user.id)).length
    const userMessages7d = chats.filter((row) => row.created_at >= since7d && row.role === 'user').length
    const assistantMessages7d = chats.filter((row) => row.created_at >= since7d && row.role === 'assistant').length
    const eventTypes = deliveryEvents.map((row) => String(row.event_type).toLowerCase())
    const sent7d = deliveries.filter((row) => row.created_at >= since7d && (row.status === 'sent' || row.sent_at)).length

    return Response.json({
      schemaVersion: 1,
      product: 'admyt',
      capturedAt: now.toISOString(),
      health: { status: 'healthy', latencyMs: Date.now() - started },
      users: { total: users.length, new7d: users.filter((user) => user.created_at >= since7d).length, active7d: currentStudents.size },
      activation: { activated7d: activatedCurrent.size, eligible28d: eligible28d.length, activated28d },
      productMetrics: {
        weeklyExploringStudents: currentStudents.size,
        newStudents7d: users.filter((user) => user.created_at >= since7d).length,
        activatedStudents7d: activatedCurrent.size,
        studentActivationRate28d: ratio(activated28d, eligible28d.length),
        sageStudentMessages7d: userMessages7d,
        schoolsSaved7d: hearts.filter((row) => row.created_at >= since7d).length,
        vibeChecksCompleted7d: vibes.filter((row) => row.created_at >= since7d).length,
        returningStudents7d: [...currentStudents].filter((id) => priorStudents.has(id)).length,
        sageSuccessRate7d: ratio(Math.min(assistantMessages7d, userMessages7d), userMessages7d),
      },
      email: {
        sent7d,
        delivered7d: eventTypes.filter((type) => type.includes('delivered')).length,
        bounced7d: eventTypes.filter((type) => type.includes('bounced')).length,
        complained28d: eventTypes.filter((type) => type.includes('complained')).length,
        failed7d: deliveries.filter((row) => row.created_at >= since7d && row.status === 'failed').length,
      },
      ai: { requests7d: assistantMessages7d, errors7d: Math.max(0, userMessages7d - assistantMessages7d) },
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error(JSON.stringify({ service: 'labs-metrics', event: 'collection_failed', error: error instanceof Error ? error.message : 'unknown' }))
    return Response.json({ error: 'collection_failed' }, { status: 500 })
  }
})

function createAdminClient() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  const secretKey = secretKeys ? JSON.parse(secretKeys).default : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(Deno.env.get('SUPABASE_URL')!, secretKey!, { auth: { persistSession: false, autoRefreshToken: false } })
}
async function loadUsers(admin: ReturnType<typeof createAdminClient>) {
  const users: Array<{ id: string; created_at: string }> = []
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    users.push(...data.users.map((user) => ({ id: user.id, created_at: user.created_at })))
    if (data.users.length < 1000) break
  }
  return users
}
async function loadRows(admin: ReturnType<typeof createAdminClient>, table: string, columns: string, since: string, dateColumn = 'created_at'): Promise<any[]> {
  const rows: any[] = []
  for (let start = 0; start < 20_000; start += 1000) {
    const { data, error } = await admin.from(table).select(columns).gte(dateColumn, since).range(start, start + 999)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return rows
}
function unique(values: string[]) { return new Set(values.filter(Boolean)) }
function ratio(numerator: number, denominator: number) { return denominator ? numerator / denominator : 0 }
async function tokenMatches(token: string): Promise<boolean> {
  if (!token) return false
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  let difference = actual.length ^ EXPECTED_TOKEN_HASH.length
  for (let index = 0; index < actual.length; index += 1) difference |= actual.charCodeAt(index) ^ EXPECTED_TOKEN_HASH.charCodeAt(index)
  return difference === 0
}
