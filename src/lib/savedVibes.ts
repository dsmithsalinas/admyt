import { supabase } from './supabase'

export interface SavedVibe {
  id?: string
  user_id: string
  college_id: string
  college_name: string
  fit_score: number
  dimensions: object
  overall_summary: string
  created_at?: string
}

export async function saveVibeCheck(vibe: Omit<SavedVibe, 'id' | 'created_at'>): Promise<string | null> {
  const { error } = await supabase
    .from('saved_vibes')
    .upsert(vibe, { onConflict: 'user_id,college_id' })
  return error?.message ?? null
}

export async function getSavedVibe(userId: string, collegeId: string): Promise<SavedVibe | null> {
  const { data, error } = await supabase
    .from('saved_vibes')
    .select('*')
    .eq('user_id', userId)
    .eq('college_id', collegeId)
    .single()
  if (error || !data) return null
  return data
}

export async function getAllSavedVibes(userId: string): Promise<SavedVibe[]> {
  const { data, error } = await supabase
    .from('saved_vibes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data
}

export async function deleteSavedVibe(userId: string, collegeId: string): Promise<string | null> {
  const { error } = await supabase
    .from('saved_vibes')
    .delete()
    .eq('user_id', userId)
    .eq('college_id', collegeId)
  return error?.message ?? null
}
