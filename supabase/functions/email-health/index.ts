import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.1";

interface WorkerRun {
  worker: "deadline_reminders" | "email_programs";
  status: "success" | "failed" | "disabled";
  metrics: Record<string, unknown>;
  finished_at: string;
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function numericMetric(run: WorkerRun, key: string): number {
  const value = run.metrics?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const expectedToken = Deno.env.get("EMAIL_OPERATIONS_MONITOR_TOKEN") ?? "";
  const providedToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expectedToken || !safeEqual(providedToken, expectedToken)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return new Response(JSON.stringify({ error: "health_check_unavailable" }), { status: 503 });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const workers = [
    { name: "email_programs" as const, staleAfterMs: 2 * 60 * 60 * 1000 },
    { name: "deadline_reminders" as const, staleAfterMs: 27 * 60 * 60 * 1000 },
  ];
  const maxSends = Number(Deno.env.get("EMAIL_OPERATIONS_MAX_SENDS_PER_RUN") ?? "100");
  const issues: string[] = [];
  const status: Record<string, unknown> = {};

  for (const worker of workers) {
    const { data, error } = await admin
      .from("email_worker_runs")
      .select("worker,status,metrics,finished_at")
      .eq("worker", worker.name)
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return new Response(JSON.stringify({ error: "health_query_failed" }), { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    const run = data as WorkerRun | null;
    if (!run) {
      issues.push(`${worker.name}:missing_run`);
      status[worker.name] = { state: "missing" };
      continue;
    }
    const ageMs = Date.now() - Date.parse(run.finished_at);
    const sentCount = numericMetric(run, "sent_count");
    const failureCount = numericMetric(run, "failure_count");
    if (!Number.isFinite(ageMs) || ageMs > worker.staleAfterMs) issues.push(`${worker.name}:stale`);
    if (run.status === "failed") issues.push(`${worker.name}:failed`);
    if (failureCount > 0) issues.push(`${worker.name}:delivery_failures`);
    if (Number.isFinite(maxSends) && sentCount > maxSends) issues.push(`${worker.name}:abnormal_volume`);
    status[worker.name] = {
      state: run.status,
      finished_at: run.finished_at,
      sent_count: sentCount,
      failure_count: failureCount,
    };
  }

  const healthy = issues.length === 0;
  return new Response(JSON.stringify({ healthy, issues, workers: status }), {
    status: healthy ? 200 : 503,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
