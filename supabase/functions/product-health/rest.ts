export type Environment = Record<string, string | undefined>;

export function credentials(env: Environment) {
  const key = env.SUPABASE_SECRET_KEYS
    ? (JSON.parse(env.SUPABASE_SECRET_KEYS) as Record<string, string>).default
    : env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !key) throw new Error("Database unavailable");
  return { url: env.SUPABASE_URL, headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) } };
}

export async function readOperationalRows(env: Environment, path: string, fetcher: typeof fetch = fetch): Promise<Record<string, unknown>[]> {
  const { url, headers } = credentials(env);
  const response = await fetcher(`${url}/rest/v1/${path}`, {
    headers, signal: AbortSignal.timeout(8_000), redirect: "error", cache: "no-store",
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error("Operational query unavailable"); }
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length > 10 || rows.some(row => !row || typeof row !== "object" || Array.isArray(row))) throw new Error("Invalid operational data");
  return rows;
}

