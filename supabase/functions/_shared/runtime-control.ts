export async function runtimeControlEnabled(
  // Supabase's generated PostgREST builder type is recursive and varies with
  // each function's inferred schema; this helper only relies on this tiny API.
  admin: any,
  key: string,
  environmentEnabled: boolean,
): Promise<boolean> {
  if (!environmentEnabled) return false
  const { data, error } = await admin.from('admin_runtime_controls')
    .select('enabled')
    .eq('key', key)
    .maybeSingle()
  if (error || typeof data?.enabled !== 'boolean') {
    throw new Error(`runtime_control_unavailable:${key}`)
  }
  return data.enabled
}
