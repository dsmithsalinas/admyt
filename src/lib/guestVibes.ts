export const GUEST_VIBES_STORAGE_KEY = 'admyt_guest_vibes'
export const GUEST_VIBES_MAX_RUNS = 3

export interface GuestVibeDimension {
  key: string
  label: string
  emoji: string
  score: number
  summary: string
}

export interface GuestVibeResult {
  dimensions: GuestVibeDimension[]
  overallSummary: string
  fitScore: number
  scoreRationale?: string
}

export interface GuestVibeRun {
  id: string
  collegeId: string
  collegeName: string
  createdAt: string
  result: GuestVibeResult
}

interface GuestVibesStore {
  version: 1
  runs: GuestVibeRun[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isGuestVibeDimension(value: unknown): value is GuestVibeDimension {
  if (!isRecord(value)) return false
  return (
    typeof value.key === 'string' &&
    typeof value.label === 'string' &&
    typeof value.emoji === 'string' &&
    typeof value.score === 'number' &&
    Number.isFinite(value.score) &&
    value.score >= 0 &&
    value.score <= 10 &&
    typeof value.summary === 'string'
  )
}

function isGuestVibeResult(value: unknown): value is GuestVibeResult {
  if (!isRecord(value)) return false
  return (
    Array.isArray(value.dimensions) &&
    value.dimensions.every(isGuestVibeDimension) &&
    typeof value.overallSummary === 'string' &&
    typeof value.fitScore === 'number' &&
    Number.isFinite(value.fitScore) &&
    value.fitScore >= 0 &&
    value.fitScore <= 100 &&
    (value.scoreRationale === undefined || typeof value.scoreRationale === 'string')
  )
}

function isGuestVibeRun(value: unknown): value is GuestVibeRun {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.collegeId === 'string' &&
    typeof value.collegeName === 'string' &&
    typeof value.createdAt === 'string' &&
    isGuestVibeResult(value.result)
  )
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStore(): GuestVibesStore {
  if (!canUseLocalStorage()) return { version: 1, runs: [] }

  try {
    const raw = window.localStorage.getItem(GUEST_VIBES_STORAGE_KEY)
    if (!raw) return { version: 1, runs: [] }

    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed) || !Array.isArray(parsed.runs)) return { version: 1, runs: [] }

    return {
      version: 1,
      runs: parsed.runs.filter(isGuestVibeRun).slice(0, GUEST_VIBES_MAX_RUNS),
    }
  } catch {
    return { version: 1, runs: [] }
  }
}

function writeStore(store: GuestVibesStore) {
  if (!canUseLocalStorage()) return

  try {
    window.localStorage.setItem(GUEST_VIBES_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // localStorage can fail in private browsing or when storage is full.
  }
}

export function getGuestVibeRuns() {
  return readStore().runs
}

export function getGuestVibeRunForCollege(collegeId: string) {
  return getGuestVibeRuns().find(run => run.collegeId === collegeId) ?? null
}

export function saveGuestVibeRun(run: Omit<GuestVibeRun, 'id' | 'createdAt'>) {
  const nextRun: GuestVibeRun = {
    ...run,
    id: `${run.collegeId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  const existingRuns = getGuestVibeRuns().filter(existing => existing.collegeId !== run.collegeId)
  const runs = [nextRun, ...existingRuns].slice(0, GUEST_VIBES_MAX_RUNS)

  writeStore({ version: 1, runs })
  return runs
}
