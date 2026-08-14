import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

const PAGE_SIZE = 1000
const USER_TABLES = [
  'chat_messages',
  'hearted_schools',
  'saved_vibes',
  'user_preferences',
] as const

const ADMYT_BROWSER_KEYS = [
  'admyt_guest_hearts',
  'admyt_guest_vibes',
  'admyt_sage_profile',
  'admyt_pending_legal_acceptance',
] as const

async function fetchEveryUserRow(table: typeof USER_TABLES[number], userId: string) {
  const rows: Record<string, unknown>[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`Could not export ${table}: ${error.message}`)
    const page = (data ?? []) as Record<string, unknown>[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  return rows
}

export async function buildAccountExport(user: User) {
  const [chatMessages, heartedSchools, savedVibes, userPreferences] = await Promise.all(
    USER_TABLES.map(table => fetchEveryUserRow(table, user.id)),
  )

  return {
    export_version: 1,
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      created_at: user.created_at,
      updated_at: user.updated_at ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      identities: user.identities ?? [],
    },
    admyt_data: {
      chat_messages: chatMessages,
      hearted_schools: heartedSchools,
      saved_vibes: savedVibes,
      user_preferences: userPreferences,
    },
    retention: {
      active_account: 'Stored until you delete it or ask Admyt to delete it.',
      deleted_account: 'Removed from the live application immediately; disaster-recovery backups age out within 7 days.',
    },
  }
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function clearAdmytBrowserData() {
  for (const key of ADMYT_BROWSER_KEYS) localStorage.removeItem(key)
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i)
    if (key?.startsWith('admyt_')) sessionStorage.removeItem(key)
  }
}

export async function deleteAdmytAccount() {
  const { data, error } = await supabase.functions.invoke('account', {
    body: { action: 'delete' },
  })
  if (error || data?.deleted !== true) throw new Error('account_delete_failed')
}
