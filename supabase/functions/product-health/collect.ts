import type { HealthSnapshot } from "./health-handler.ts";
import { readOperationalRows, type Environment } from "./rest.ts";

export async function collectHealth(env: Environment, fetcher: typeof fetch = fetch): Promise<HealthSnapshot> {
  const started = Date.now();
  const read = (path: string) => readOperationalRows(env, path, fetcher);
  const workers = [{ id: "email_programs", maxAgeMinutes: 120 }, { id: "deadline_reminders", maxAgeMinutes: 27 * 60 }];
  const checks: Record<string, boolean> = { database: true };
  const jobs = await Promise.all(workers.map(async worker => {
    const base = `email_worker_runs?select=status,finished_at&worker=eq.${worker.id}&order=finished_at.desc&limit=1`;
    const [latest, success] = await Promise.all([read(base), read(`${base}&status=eq.success`)]);
    checks[`${worker.id}_latest_successful`] = latest[0]?.status === "success";
    const last = success[0]?.finished_at;
    if (last !== undefined && typeof last !== "string") throw new Error("Invalid job evidence");
    return { ...worker, lastSuccessAt: last ?? null };
  }));
  const [catalogRows, budgetRows] = await Promise.all([
    read("data_source_status?select=last_refreshed_at,record_count&source=eq.college_scorecard&limit=1"),
    read("rate_limits?select=count,window_start&key=eq.global%3Aanthropic%3Arolling-day&limit=1"),
  ]);
  const catalog = catalogRows[0];
  const catalogTime = typeof catalog?.last_refreshed_at === "string" ? Date.parse(catalog.last_refreshed_at) : NaN;
  checks.catalog_current = Number.isFinite(catalogTime) && catalogTime <= Date.now() + 60_000
    && Date.now() - catalogTime <= 90 * 86_400_000 && typeof catalog?.record_count === "number" && catalog.record_count > 0;
  const budget = budgetRows[0];
  const windowTime = typeof budget?.window_start === "string" ? Date.parse(budget.window_start) : NaN;
  if (budget && (!Number.isFinite(windowTime) || typeof budget.count !== "number" || !Number.isFinite(budget.count) || budget.count < 0)) throw new Error("Invalid budget evidence");
  const used = budget && Date.now() - windowTime <= 86_400_000 ? budget.count as number : 0;
  const configuredLimit = Number(env.ANTHROPIC_DAILY_REQUEST_LIMIT);
  const limit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 100;
  checks.ai_budget_below_warning = used < limit * 0.8;
  return { checks, jobs, metrics: { database_latency_ms: Date.now() - started, ai_requests_rolling_day: used, ai_request_limit: limit } };
}
