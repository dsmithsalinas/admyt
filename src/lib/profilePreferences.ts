import { supabase } from './supabase'

export interface ProfilePreferenceColumns {
  preferred_states?: string[] | null
  max_tuition?: number | null
  preferred_majors?: string[] | null
  sage_profile?: Record<string, unknown> | null
}

export interface ProfilePreferenceFields {
  preferredLocations?: string[]
  careerGoals?: string[]
  intendedMajor?: string
  preferredStates?: string[]
  maxTuition?: number | null
  preferredMajors?: string[]
  preferredSize?: 'small' | 'medium' | 'large' | null
  preferredInstitutionType?: 'two_year' | 'four_year' | 'either' | null
}

export async function loadProfilePreferences(userId: string): Promise<ProfilePreferenceColumns | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('preferred_states,max_tuition,preferred_majors,sage_profile')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load user preferences:', error.message)
    return null
  }

  return data
}

export function mergeProfilePreferenceFields<T extends ProfilePreferenceFields>(
  base: T | null,
  prefs: ProfilePreferenceColumns | null,
): T | null {
  if (!base && !prefs) return null

  const sageProfile = (prefs?.sage_profile ?? null) as Partial<T> | null
  const merged = {
    preferredLocations: [],
    careerGoals: [],
    complete: false,
    ...base,
    ...sageProfile,
  } as unknown as T

  return {
    ...merged,
    preferredStates: prefs?.preferred_states ?? merged.preferredStates ?? [],
    maxTuition: prefs?.max_tuition ?? merged.maxTuition ?? null,
    preferredMajors: prefs?.preferred_majors ?? merged.preferredMajors ?? [],
    preferredSize: merged.preferredSize ?? null,
    preferredInstitutionType: merged.preferredInstitutionType ?? null,
  }
}
