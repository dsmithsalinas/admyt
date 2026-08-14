import '@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.108.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function env(key: string): string {
  return Deno.env.get(key) ?? ''
}

function response(body: unknown, status: number, requestId: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
    },
  })
}

function log(level: 'info' | 'error', event: string, fields: Record<string, unknown>) {
  const entry = JSON.stringify({
    level,
    service: 'account',
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  })
  if (level === 'error') console.error(entry)
  else console.log(entry)
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startedAt = Date.now()
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID()

  try {
    if (req.method !== 'POST') return response({ error: 'method_not_allowed' }, 405, requestId)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return response({ error: 'unauthorized' }, 401, requestId)

    const url = env('SUPABASE_URL')
    const anonKey = env('SUPABASE_ANON_KEY')
    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !anonKey || !serviceKey) throw new Error('missing_server_configuration')

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return response({ error: 'unauthorized' }, 401, requestId)

    const body = await req.json()
    if (body?.action !== 'delete') return response({ error: 'unknown_action' }, 400, requestId)

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: dataError } = await admin.rpc('delete_account_data', { p_user_id: user.id })
    if (dataError) throw new Error(`account_data_delete_failed:${dataError.code ?? 'unknown'}`)

    const jwt = authHeader.slice('Bearer '.length)
    const { error: signOutError } = await admin.auth.admin.signOut(jwt, 'global')
    if (signOutError) {
      log('error', 'session_revoke_failed', { request_id: requestId, code: signOutError.code ?? 'unknown' })
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false)
    if (deleteError) throw new Error(`auth_user_delete_failed:${deleteError.code ?? 'unknown'}`)

    log('info', 'account_deleted', {
      request_id: requestId,
      status: 200,
      duration_ms: Date.now() - startedAt,
    })
    return response({ deleted: true }, 200, requestId)
  } catch (error) {
    log('error', 'account_delete_failed', {
      request_id: requestId,
      status: 500,
      duration_ms: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'unknown_error',
    })
    return response({ error: 'account_delete_failed' }, 500, requestId)
  }
})
