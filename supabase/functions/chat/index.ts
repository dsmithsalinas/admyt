import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Persist a generated college description using the service-role key. RLS blocks
// anonymous writes to `colleges`, so description caching has to happen here on
// the server rather than from the browser.
async function cacheCollegeDescription(collegeId: string, description: string) {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return

  await fetch(`${url}/rest/v1/colleges?id=eq.${encodeURIComponent(collegeId)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ description }),
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cost-amplification guards. This function runs on the public anon key, so cap
    // what a single call can cost even though full per-IP rate limiting (which needs
    // a store) is a separate follow-up.
    const raw = await req.text()
    // ~1MB covers the full catalog system prompt plus a very long conversation,
    // while still blocking multi-megabyte abuse.
    if (raw.length > 1_000_000) {
      return new Response(JSON.stringify({ error: 'payload_too_large' }), {
        status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { messages, system, max_tokens, cacheDescription } = JSON.parse(raw)

    // High ceiling — a real conversation sends its whole history each turn, so this
    // is a sanity bound against abuse, not a normal-usage limit.
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 1000) {
      return new Response(JSON.stringify({ error: 'invalid_messages' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Clamp completion length so a caller can't request an expensive giant output.
    const MAX_OUTPUT = 2048
    const clampedMaxTokens = Math.min(typeof max_tokens === 'number' && max_tokens > 0 ? max_tokens : 2000, MAX_OUTPUT)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: clampedMaxTokens,
        system,
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, JSON.stringify(data))
      return new Response(JSON.stringify({ error: 'upstream_error', status: response.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Optionally cache a generated description server-side (service role bypasses RLS).
    const text = data?.content?.[0]?.text?.trim()
    if (cacheDescription?.collegeId && typeof text === 'string' && text) {
      try {
        await cacheCollegeDescription(String(cacheDescription.collegeId), text)
      } catch (e) {
        console.error('Failed to cache description:', e)
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
