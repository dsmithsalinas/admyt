import { createClient } from "npm:@supabase/supabase-js@2.108.1";

export type EmailWorkerName = "deadline_reminders" | "email_programs";
export type EmailWorkerStatus = "success" | "failed" | "disabled";

export async function recordEmailWorkerRun(input: {
  supabaseUrl: string;
  serviceKey: string;
  worker: EmailWorkerName;
  requestId: string;
  status: EmailWorkerStatus;
  metrics?: Record<string, number | boolean>;
  errorCode?: string;
  startedAt: string;
  durationMs: number;
}): Promise<boolean> {
  if (!input.supabaseUrl || !input.serviceKey) return false;
  const admin = createClient(input.supabaseUrl, input.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.from("email_worker_runs").upsert({
    worker: input.worker,
    request_id: input.requestId,
    status: input.status,
    metrics: input.metrics ?? {},
    error_code: input.errorCode ?? null,
    started_at: input.startedAt,
    finished_at: new Date().toISOString(),
    duration_ms: Math.max(0, Math.round(input.durationMs)),
  }, { onConflict: "request_id" });
  return !error;
}
