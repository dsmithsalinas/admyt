import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.1";
import {
  buildEmailPreview,
  emailTemplateCatalog,
  isEmailTemplateId,
} from "../_shared/email-preview-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function env(key: string): string {
  return Deno.env.get(key) ?? "";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function adminEmails(): Set<string> {
  return new Set(env("EMAIL_OPERATIONS_ADMIN_EMAILS").split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean));
}

function countBy<T extends string>(values: Array<T | null>, keys: readonly T[]): Record<T, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
  for (const value of values) if (value && value in counts) counts[value] += 1;
  return counts;
}

interface WorkerHealthRun {
  worker: "deadline_reminders" | "email_programs";
  status: "success" | "failed" | "disabled";
  metrics: Record<string, unknown>;
  finished_at: string;
}

function numericMetric(run: WorkerHealthRun, key: string): number {
  const value = run.metrics?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "operations_unavailable" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  const email = user?.email?.trim().toLowerCase();
  if (userError || !user || !email) return json({ error: "unauthorized" }, 401);

  const allowedEmails = adminEmails();
  if (allowedEmails.size === 0) return json({ error: "admin_allowlist_not_configured" }, 503);
  if (!allowedEmails.has(email)) return json({ error: "forbidden" }, 403);

  const url = new URL(req.url);
  const requestedTemplate = url.searchParams.get("template");
  if (req.method === "GET" && requestedTemplate) {
    if (!isEmailTemplateId(requestedTemplate)) return json({ error: "unknown_template" }, 400);
    return json({ preview: buildEmailPreview(requestedTemplate) });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (req.method === "POST") {
    let body: { action?: unknown; template?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    if (body.action === "preview" && isEmailTemplateId(body.template)) {
      return json({ preview: buildEmailPreview(body.template) });
    }
    if (body.action === "send_test" && isEmailTemplateId(body.template)) {
      const resendKey = env("RESEND_API_KEY");
      if (!resendKey) return json({ error: "resend_not_configured" }, 503);
      const preview = buildEmailPreview(body.template);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `email-operations/${user.id}/${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          from: preview.from,
          to: [email],
          subject: `[Test] ${preview.subject}`,
          html: preview.html,
          text: preview.text,
        }),
      });
      if (!response.ok) return json({ error: "test_send_failed", provider_status: response.status }, 502);
      return json({ sent: true, recipient: email, template: preview.id });
    }
    if (body.action === "system_health") {
      const [workerRuns, budgetRow, catalogRow] = await Promise.all([
        admin.from("email_worker_runs")
          .select("worker,status,metrics,finished_at")
          .order("finished_at", { ascending: false })
          .limit(20),
        admin.from("rate_limits")
          .select("count,window_start")
          .eq("key", "global:anthropic:rolling-day")
          .maybeSingle(),
        admin.from("data_source_status")
          .select("source,last_refreshed_at,record_count,details")
          .eq("source", "college_scorecard")
          .maybeSingle(),
      ]);
      const healthQueryError = [workerRuns, budgetRow, catalogRow].find((result) => result.error)?.error;
      if (healthQueryError) return json({ error: "operations_query_failed" }, 500);

      const issues: string[] = [];
      const latestRuns = new Map<string, WorkerHealthRun>();
      for (const run of (workerRuns.data ?? []) as WorkerHealthRun[]) {
        if (!latestRuns.has(run.worker)) latestRuns.set(run.worker, run);
      }

      const workerConfigs = [
        { name: "email_programs" as const, label: "Guidance + digest", staleAfterMs: 2 * 60 * 60 * 1000 },
        { name: "deadline_reminders" as const, label: "Deadline reminders", staleAfterMs: 27 * 60 * 60 * 1000 },
      ];
      const workers = Object.fromEntries(workerConfigs.map((config) => {
        const run = latestRuns.get(config.name);
        if (!run) {
          issues.push(`${config.label} has not recorded a run yet.`);
          return [config.name, {
            label: config.label, state: "attention", status: "missing", finished_at: null,
            sent_count: 0, failure_count: 0,
          }];
        }
        const sentCount = numericMetric(run, "sent_count");
        const failureCount = numericMetric(run, "failure_count");
        const ageMs = Date.now() - Date.parse(run.finished_at);
        let state: "healthy" | "attention" | "paused" = "healthy";
        if (run.status === "disabled") {
          state = "paused";
          issues.push(`${config.label} is paused by its server-side kill switch.`);
        } else if (run.status === "failed" || failureCount > 0) {
          state = "attention";
          issues.push(`${config.label} reported a failed run or delivery failure.`);
        } else if (!Number.isFinite(ageMs) || ageMs > config.staleAfterMs) {
          state = "attention";
          issues.push(`${config.label} has not completed within its expected schedule.`);
        }
        return [config.name, {
          label: config.label, state, status: run.status, finished_at: run.finished_at,
          sent_count: sentCount, failure_count: failureCount,
        }];
      }));

      const configuredAiLimit = Number(env("ANTHROPIC_DAILY_REQUEST_LIMIT"));
      const aiLimit = Number.isFinite(configuredAiLimit) && configuredAiLimit > 0 ? configuredAiLimit : 100;
      const storedBudget = budgetRow.data as { count: number; window_start: string } | null;
      const budgetWindowActive = storedBudget
        ? Date.now() - Date.parse(storedBudget.window_start) <= 24 * 60 * 60 * 1000
        : false;
      const aiUsed = budgetWindowActive ? Math.max(Number(storedBudget?.count ?? 0), 0) : 0;
      const aiRatio = aiUsed / aiLimit;
      const aiState = aiRatio >= 0.8 ? "attention" : "healthy";
      if (aiState === "attention") issues.push(`Sage has used ${aiUsed} of ${aiLimit} requests in the rolling AI budget window.`);

      const catalog = catalogRow.data as {
        source: string;
        last_refreshed_at: string;
        record_count: number;
        details: { provider?: unknown } | null;
      } | null;
      const catalogAgeMs = catalog ? Date.now() - Date.parse(catalog.last_refreshed_at) : Number.POSITIVE_INFINITY;
      const catalogState = catalog && catalog.record_count > 0 && Number.isFinite(catalogAgeMs) && catalogAgeMs <= 90 * 24 * 60 * 60 * 1000
        ? "healthy"
        : "attention";
      if (catalogState === "attention") issues.push("The college catalog is missing, empty, or more than 90 days old.");

      return json({
        admin: { email },
        generated_at: new Date().toISOString(),
        overall: { state: issues.length === 0 ? "healthy" : "attention", issue_count: issues.length },
        ai_budget: {
          state: aiState,
          used: aiUsed,
          limit: aiLimit,
          remaining: Math.max(aiLimit - aiUsed, 0),
          window_start: budgetWindowActive ? storedBudget?.window_start ?? null : null,
        },
        catalog: {
          state: catalogState,
          source: catalog?.source ?? "college_scorecard",
          provider: typeof catalog?.details?.provider === "string" ? catalog.details.provider : "U.S. Department of Education College Scorecard",
          record_count: Number(catalog?.record_count ?? 0),
          last_refreshed_at: catalog?.last_refreshed_at ?? null,
        },
        workers,
        issues,
      });
    }
    if (body.action === "data_quality") {
      const [savedSchools, deadlineRows, catalogRow] = await Promise.all([
        admin.from("hearted_schools")
          .select("college_id,college_name")
          .limit(5000),
        admin.from("college_deadlines")
          .select("college_id,deadlines,updated_at")
          .limit(5000),
        admin.from("data_source_status")
          .select("source,last_refreshed_at,record_count,details")
          .eq("source", "college_scorecard")
          .maybeSingle(),
      ]);
      const qualityQueryError = [savedSchools, deadlineRows, catalogRow].find((result) => result.error)?.error;
      if (qualityQueryError) return json({ error: "operations_query_failed" }, 500);

      const savedSchoolCounts = new Map<string, { name: string; count: number }>();
      for (const row of savedSchools.data ?? []) {
        const id = String(row.college_id ?? "");
        if (!id) continue;
        const existing = savedSchoolCounts.get(id);
        savedSchoolCounts.set(id, {
          name: String(row.college_name ?? existing?.name ?? "Unknown school"),
          count: (existing?.count ?? 0) + 1,
        });
      }

      const deadlinesByCollege = new Map<string, { deadlines: unknown; updated_at: string }>();
      for (const row of deadlineRows.data ?? []) {
        deadlinesByCollege.set(String(row.college_id), {
          deadlines: row.deadlines,
          updated_at: String(row.updated_at),
        });
      }

      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const schools = [...savedSchoolCounts.entries()].map(([collegeId, saved]) => {
        const cached = deadlinesByCollege.get(collegeId);
        const deadlineObject = cached?.deadlines && typeof cached.deadlines === "object"
          ? cached.deadlines as { rounds?: unknown; source_url?: unknown }
          : null;
        const rounds = Array.isArray(deadlineObject?.rounds) ? deadlineObject.rounds : [];
        const sourceUrl = typeof deadlineObject?.source_url === "string" ? deadlineObject.source_url : null;
        const hasOfficialSource = Boolean(sourceUrl?.startsWith("https://"));
        const ageMs = cached ? Date.now() - Date.parse(cached.updated_at) : Number.POSITIVE_INFINITY;
        let state: "verified" | "stale" | "missing_source" | "missing" = "verified";
        if (!cached || rounds.length === 0) state = "missing";
        else if (!hasOfficialSource) state = "missing_source";
        else if (!Number.isFinite(ageMs) || ageMs > sevenDaysMs) state = "stale";
        return {
          college_id: collegeId,
          college_name: saved.name,
          saved_count: saved.count,
          state,
          updated_at: cached?.updated_at ?? null,
          source_url: hasOfficialSource ? sourceUrl : null,
          round_count: rounds.length,
        };
      });
      const statePriority = { missing: 0, missing_source: 1, stale: 2, verified: 3 } as const;
      schools.sort((left, right) => statePriority[left.state] - statePriority[right.state]
        || right.saved_count - left.saved_count
        || left.college_name.localeCompare(right.college_name));

      const summary = {
        saved_school_records: savedSchools.data?.length ?? 0,
        unique_saved_schools: schools.length,
        verified: schools.filter((school) => school.state === "verified").length,
        stale: schools.filter((school) => school.state === "stale").length,
        missing_source: schools.filter((school) => school.state === "missing_source").length,
        missing: schools.filter((school) => school.state === "missing").length,
      };
      const catalog = catalogRow.data as {
        source: string;
        last_refreshed_at: string;
        record_count: number;
        details: { provider?: unknown } | null;
      } | null;

      return json({
        admin: { email },
        generated_at: new Date().toISOString(),
        summary,
        catalog: {
          source: catalog?.source ?? "college_scorecard",
          provider: typeof catalog?.details?.provider === "string" ? catalog.details.provider : "U.S. Department of Education College Scorecard",
          record_count: Number(catalog?.record_count ?? 0),
          last_refreshed_at: catalog?.last_refreshed_at ?? null,
        },
        schools: schools.filter((school) => school.state !== "verified").slice(0, 50),
      });
    }
    if (body.action !== "dashboard") return json({ error: "invalid_request" }, 400);
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [runs, deliveries, events, suppressions, bounceSuppressions, complaintSuppressions, providerSuppressions, manualSuppressions, deadlineOptIns, guidanceOptIns, digestOptIns, recentDeliveries] = await Promise.all([
    admin.from("email_worker_runs").select("worker,status,metrics,error_code,started_at,finished_at,duration_ms").order("finished_at", { ascending: false }).limit(20),
    admin.from("notification_deliveries").select("kind,status,provider_status,error_code,sent_at,created_at").order("created_at", { ascending: false }).limit(30),
    admin.from("email_delivery_events").select("event_type,occurred_at,received_at").order("received_at", { ascending: false }).limit(30),
    admin.from("email_suppressions").select("email_hash", { count: "exact", head: true }),
    admin.from("email_suppressions").select("email_hash", { count: "exact", head: true }).eq("reason", "bounce"),
    admin.from("email_suppressions").select("email_hash", { count: "exact", head: true }).eq("reason", "complaint"),
    admin.from("email_suppressions").select("email_hash", { count: "exact", head: true }).eq("reason", "provider_suppression"),
    admin.from("email_suppressions").select("email_hash", { count: "exact", head: true }).eq("reason", "manual"),
    admin.from("notification_preferences").select("user_id", { count: "exact", head: true }).eq("deadline_reminders_enabled", true),
    admin.from("notification_preferences").select("user_id", { count: "exact", head: true }).eq("getting_started_enabled", true),
    admin.from("notification_preferences").select("user_id", { count: "exact", head: true }).eq("weekly_digest_enabled", true),
    admin.from("notification_deliveries").select("status,provider_status").gte("created_at", oneDayAgo),
  ]);
  const queryError = [runs, deliveries, events, suppressions, bounceSuppressions, complaintSuppressions, providerSuppressions, manualSuppressions, deadlineOptIns, guidanceOptIns, digestOptIns, recentDeliveries]
    .find((result) => result.error)?.error;
  if (queryError) return json({ error: "operations_query_failed" }, 500);

  const recentRows = recentDeliveries.data ?? [];
  return json({
    admin: { email },
    templates: emailTemplateCatalog(),
    summary: {
      opted_in: {
        deadline_reminders: deadlineOptIns.count ?? 0,
        getting_started: guidanceOptIns.count ?? 0,
        weekly_digest: digestOptIns.count ?? 0,
      },
      suppressions: {
        total: suppressions.count ?? 0,
        by_reason: {
          bounce: bounceSuppressions.count ?? 0,
          complaint: complaintSuppressions.count ?? 0,
          provider_suppression: providerSuppressions.count ?? 0,
          manual: manualSuppressions.count ?? 0,
        },
      },
      last_24_hours: {
        delivery_status: countBy(recentRows.map((row) => row.status), ["pending", "sent", "failed"] as const),
        provider_status: countBy(recentRows.map((row) => row.provider_status), ["delivered", "bounced", "complained", "suppressed"] as const),
      },
    },
    runs: runs.data ?? [],
    deliveries: deliveries.data ?? [],
    events: events.data ?? [],
  });
});
