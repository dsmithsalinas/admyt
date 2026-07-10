import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  buildSagePrompt,
  buildVibePrompt,
  buildDescriptionPrompt,
  buildDeadlinePrompt,
  mapRow,
  type College,
  type SageProfile,
} from './prompt.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Per-IP rate limit. Generous by default because students may share a school/library
// IP; tune these two numbers to trade abuse-resistance against shared-network use.
const RATE_LIMIT = 40
const RATE_WINDOW_SECONDS = 60

const COLLEGE_FIELDS = 'id,name,location,type,size,enrollment,acceptance_rate,tuition_in_state,tuition_out_state,majors'

function env(key: string): string {
  return Deno.env.get(key) ?? ''
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  })
}

// Returns true when the caller has exceeded the limit. Fails OPEN on any error so
// the limiter can never take the app down.
async function isRateLimited(req: Request): Promise<boolean> {
  const url = env('SUPABASE_URL')
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return false

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
  if (!ip) return false

  try {
    const resp = await fetch(`${url}/rest/v1/rpc/check_rate_limit`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_key: `ip:${ip}`, p_limit: RATE_LIMIT, p_window_seconds: RATE_WINDOW_SECONDS }),
    })
    if (!resp.ok) return false
    return (await resp.json()) === false
  } catch {
    return false
  }
}

// The full college list, mapped and cached in-instance so we don't hit the DB on
// every chat request. Refreshed on a short TTL; the catalog changes rarely.
let catalogCache: College[] | null = null
let catalogAt = 0
const CATALOG_TTL_MS = 10 * 60 * 1000

async function getCatalog(): Promise<College[]> {
  const now = Date.now()
  if (catalogCache && now - catalogAt < CATALOG_TTL_MS) return catalogCache

  const url = env('SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  const resp = await fetch(
    `${url}/rest/v1/colleges?select=${COLLEGE_FIELDS}&order=enrollment.desc.nullslast&limit=1000`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  if (!resp.ok) throw new Error(`catalog fetch failed: ${resp.status}`)
  const rows = await resp.json()
  catalogCache = (rows as Record<string, unknown>[]).map(mapRow)
  catalogAt = now
  return catalogCache
}

async function fetchCollege(id: string): Promise<College | null> {
  if (!id) return null
  const url = env('SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  const resp = await fetch(
    `${url}/rest/v1/colleges?id=eq.${encodeURIComponent(id)}&select=${COLLEGE_FIELDS}&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  if (!resp.ok) return null
  const rows = await resp.json()
  return rows[0] ? mapRow(rows[0]) : null
}

// ── Application deadlines ────────────────────────────────────────────────────
// Deadlines are per-school, not per-user, so they're cached once in
// college_deadlines and shared: the first user to heart a school triggers one
// web search; everyone else reads the cached row. Refreshed lazily (~10 months).
const DEADLINE_FRESH_MS = 300 * 24 * 60 * 60 * 1000
// Empty/failed lookups retry weekly instead of being trusted for ~10 months.
const DEADLINE_EMPTY_RETRY_MS = 7 * 24 * 60 * 60 * 1000

async function getDeadlineRow(collegeId: string): Promise<{ deadlines: unknown; updated_at: string } | null> {
  const url = env('SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  const resp = await fetch(
    `${url}/rest/v1/college_deadlines?college_id=eq.${encodeURIComponent(collegeId)}&select=deadlines,updated_at&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  if (!resp.ok) return null
  const rows = await resp.json()
  return rows[0] ?? null
}

async function saveDeadline(collegeId: string, deadlines: unknown) {
  const url = env('SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  await fetch(`${url}/rest/v1/college_deadlines`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ college_id: collegeId, deadlines, updated_at: new Date().toISOString() }),
  })
}

function parseDeadlines(text: string): { rounds: unknown[]; rolling?: boolean; cycle?: string; source_url?: string } | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '')
  const tryParse = (s: string) => {
    try {
      const obj = JSON.parse(s)
      if (obj && Array.isArray(obj.rounds)) return obj
    } catch { /* not valid JSON */ }
    return null
  }
  // Whole string first, then the first {...} object (web-search replies often
  // wrap the JSON in a sentence or citations).
  const whole = tryParse(cleaned.trim())
  if (whole) return whole
  const match = cleaned.match(/\{[\s\S]*\}/)
  return match ? tryParse(match[0]) : null
}

async function handleDeadline(body: { collegeId?: unknown }): Promise<Response> {
  const college = await fetchCollege(String(body.collegeId ?? ''))
  if (!college) return json({ error: 'college_not_found' }, 404)

  // Serve from the shared cache when fresh — no web search, no cost. A real
  // result is trusted for ~10 months; an empty one is retried within a week.
  const cached = await getDeadlineRow(college.id)
  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime()
    const dl = cached.deadlines as { rounds?: unknown[]; rolling?: boolean } | null
    const hasContent = !!dl && (dl.rolling === true || (Array.isArray(dl.rounds) && dl.rounds.length > 0))
    if (age < (hasContent ? DEADLINE_FRESH_MS : DEADLINE_EMPTY_RETRY_MS)) {
      return json({ deadlines: cached.deadlines, cached: true })
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const built = buildDeadlinePrompt(college, today)
  const tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }]
  let messages: unknown[] = [{ role: 'user', content: built.userMessage }]
  let data: { content?: { type: string; text?: string }[]; stop_reason?: string } | null = null

  // The web-search server tool runs a loop; if it pauses (pause_turn) re-send to continue.
  for (let guard = 0; guard < 4; guard++) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, system: built.system, tools, messages }),
    })
    data = await resp.json()
    if (!resp.ok) {
      console.error('Deadline lookup upstream error:', resp.status, JSON.stringify(data))
      return json({ error: 'upstream_error', status: resp.status }, 502)
    }
    if (data?.stop_reason === 'pause_turn') {
      messages = [...messages, { role: 'assistant', content: data.content }]
      continue
    }
    break
  }

  const text = (data?.content ?? []).filter(b => b.type === 'text').map(b => b.text ?? '').join('').trim()
  const parsed = parseDeadlines(text)
  const deadlines = parsed ?? { rounds: [], rolling: false, cycle: '', source_url: '' }
  // Guard: never surface a past-dated deadline even if the model returns one from
  // an archived cycle page. Dates are ISO (YYYY-MM-DD), so a string compare works.
  if (Array.isArray(deadlines.rounds)) {
    deadlines.rounds = (deadlines.rounds as { date?: string }[]).filter(
      r => typeof r.date === 'string' && r.date >= today,
    )
  }
  // Cache the result (even empty) so we don't re-search this school within the window.
  await saveDeadline(college.id, deadlines)
  return json({ deadlines })
}

// Persist a generated college description with the service-role key (RLS blocks
// anonymous writes to `colleges`).
async function cacheCollegeDescription(collegeId: string, description: string) {
  const url = env('SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return
  await fetch(`${url}/rest/v1/colleges?id=eq.${encodeURIComponent(collegeId)}`, {
    method: 'PATCH',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ description }),
  })
}

function streamAnthropicText(response: Response): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const reader = response.body?.getReader()

  return new ReadableStream({
    async start(controller) {
      if (!reader) {
        controller.close()
        return
      }

      let buffer = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const rawLine of lines) {
            const line = rawLine.trim()
            if (!line.startsWith('data:')) continue

            const payload = line.slice(5).trim()
            if (!payload || payload === '[DONE]') continue

            let event: {
              type?: string
              delta?: { type?: string; text?: string }
            }
            try {
              event = JSON.parse(payload)
            } catch {
              continue
            }

            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text ?? ''))
            }
            if (event.type === 'message_stop') {
              controller.close()
              return
            }
          }
        }
        controller.close()
      } catch (err) {
        console.error('Anthropic stream error:', err)
        controller.error(err)
      } finally {
        reader.releaseLock()
      }
    },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Per-IP rate limit first — cheapest guard, uses only headers.
    if (await isRateLimited(req)) {
      return json({ error: 'rate_limited' }, 429, { 'Retry-After': String(RATE_WINDOW_SECONDS) })
    }

    const rawBody = await req.text()
    if (rawBody.length > 1_000_000) {
      return json({ error: 'payload_too_large' }, 413)
    }

    const body = JSON.parse(rawBody)
    const type = body?.type

    // Deadlines are fully self-contained (cache + web search + store) — they don't
    // share the single-shot Anthropic call the other types fall through to.
    if (type === 'deadline') {
      return await handleDeadline(body)
    }

    // Build the prompt server-side by request type. The endpoint never accepts a
    // client-supplied system prompt, so it can't be used as a general Claude proxy.
    let system: unknown
    let messages: unknown
    let maxTokens = 2000
    let cacheDescriptionCollegeId: string | null = null

    if (type === 'sage') {
      const msgs = body.messages
      if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > 1000) {
        return json({ error: 'invalid_messages' }, 400)
      }
      const catalog = await getCatalog()
      system = buildSagePrompt(catalog, body.profile as SageProfile | undefined)
      messages = msgs
    } else if (type === 'vibe') {
      const college = await fetchCollege(String(body.collegeId ?? ''))
      if (!college) return json({ error: 'college_not_found' }, 404)
      const dimensionKeys = Array.isArray(body.dimensionKeys) ? body.dimensionKeys.map(String) : []
      const built = buildVibePrompt(college, dimensionKeys, body.profile as SageProfile | undefined)
      system = built.system
      messages = [{ role: 'user', content: built.userMessage }]
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env('ANTHROPIC_API_KEY'),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: Math.min(maxTokens, 2048),
          system,
          messages,
          stream: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Anthropic API error:', response.status, JSON.stringify(data))
        return json({ error: 'upstream_error', status: response.status }, 502)
      }

      return new Response(streamAnthropicText(response), {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
      })
    } else if (type === 'description') {
      const college = await fetchCollege(String(body.collegeId ?? ''))
      if (!college) return json({ error: 'college_not_found' }, 404)
      const built = buildDescriptionPrompt(college)
      system = built.system
      messages = [{ role: 'user', content: built.userMessage }]
      maxTokens = 150
      cacheDescriptionCollegeId = college.id
    } else {
      return json({ error: 'unknown_type' }, 400)
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: Math.min(maxTokens, 2048),
        system,
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, JSON.stringify(data))
      return json({ error: 'upstream_error', status: response.status }, 502)
    }

    const text = data?.content?.[0]?.text?.trim()
    if (cacheDescriptionCollegeId && typeof text === 'string' && text) {
      try {
        await cacheCollegeDescription(cacheDescriptionCollegeId, text)
      } catch (e) {
        console.error('Failed to cache description:', e)
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
