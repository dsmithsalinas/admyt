import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.1";
import { runtimeControlEnabled } from "../_shared/runtime-control.ts";
import { emailFingerprint } from "../_shared/email-fingerprint.ts";
import { createUnsubscribeUrl } from "../_shared/email-unsubscribe.ts";
import { recordEmailWorkerRun } from "../_shared/email-worker-run.ts";
import {
  guidanceEmailContent,
  weeklyDigestEmailContent,
  type DigestDeadline,
  type DigestSchool,
} from "../_shared/email-program-content.ts";
import {
  planReminderEmailContent,
  type PlanReminderEmailItem,
} from "../_shared/plan-reminder-email-content.ts";

const MAX_USERS_PER_RUN = 500;
const MAX_DIGEST_SCHOOLS = 5;
const FRESH_DEADLINE_DAYS = 7;
const DIGEST_DEADLINE_WINDOW_DAYS = 60;
const GUIDANCE_DELAYS = [1, 3, 7] as const;
const PLAN_LEAD_DAYS = new Set([0, 7]);
const MAX_PLAN_TASKS_PER_EMAIL = 20;

interface PreferenceRow {
  user_id: string;
  timezone: string;
  getting_started_enabled: boolean;
  getting_started_opted_in_at: string | null;
  weekly_digest_enabled: boolean;
  weekly_digest_opted_in_at: string | null;
  plan_reminders_enabled: boolean;
  plan_reminders_opted_in_at: string | null;
}
interface HeartRow {
  user_id: string;
  college_id: string;
  college_name: string;
  created_at: string;
}
interface VibeRow {
  user_id: string;
  college_id: string;
  fit_score: number;
}
interface DeliveryRow {
  user_id: string;
  kind: string;
  dedupe_key: string;
  status: string;
}
interface DeadlineRound {
  type: string;
  date: string;
}
interface DeadlineRow {
  college_id: string;
  deadlines: { rounds?: DeadlineRound[]; source_url?: string } | null;
  updated_at: string;
}
interface EmailContent {
  subject: string;
  html: string;
  text: string;
}
interface PlanRow { id: string; user_id: string }
interface PlanTaskRow {
  id: string;
  plan_id: string;
  title: string;
  owner_role: "student" | "parent";
  college_name: string | null;
  due_date: string;
}

function env(key: string): string {
  return Deno.env.get(key) ?? "";
}
function json(body: unknown, status: number, requestId: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "X-Request-Id": requestId },
  });
}
function log(level: "info" | "error", event: string, fields: Record<string, unknown>) {
  const entry = JSON.stringify({
    level,
    service: "email-programs",
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") console.error(entry);
  else console.log(entry);
}
function hasVerifiedServiceRole(authHeader: string | null, supabaseUrl: string): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const encodedPayload = authHeader.slice("Bearer ".length).split(".")[1];
    if (!encodedPayload) return false;
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { role?: string; ref?: string };
    return payload.role === "service_role" && payload.ref === new URL(supabaseUrl).hostname.split(".")[0];
  } catch {
    return false;
  }
}
function localDate(timezone: string, now: Date): string | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return null;
  }
}
function localWeekday(timezone: string, now: Date): string | null {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(now);
  } catch {
    return null;
  }
}
function localHour(timezone: string, now: Date): number | null {
  try {
    const value = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now);
    const hour = Number(value);
    return Number.isInteger(hour) ? hour : null;
  } catch {
    return null;
  }
}
function elapsedDays(iso: string | null, now: Date): number {
  const timestamp = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(timestamp) ? Math.floor((now.getTime() - timestamp) / 86_400_000) : -1;
}
function daysBetween(fromIso: string, toIso: string): number | null {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return Math.round((to - from) / 86_400_000);
}
function validSourceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
async function idempotencyKey(dedupeKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dedupeKey));
  const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `email-program/${hash}`;
}

Deno.serve(async (req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  const startedAtIso = new Date(startedAt).toISOString();
  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, requestId);
    const url = env("SUPABASE_URL");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = env("RESEND_API_KEY");
    const suppressionHashKey = env("EMAIL_SUPPRESSION_HASH_KEY");
    const unsubscribeSigningKey = env("EMAIL_UNSUBSCRIBE_SIGNING_KEY");
    const testUserId = env("EMAIL_PROGRAMS_TEST_USER_ID");
    if (!url || !serviceKey) throw new Error("missing_supabase_configuration");
    if (!hasVerifiedServiceRole(req.headers.get("Authorization"), url)) {
      return json({ error: "unauthorized" }, 401, requestId);
    }
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    if (!await runtimeControlEnabled(admin, "email_programs_enabled", env("EMAIL_PROGRAMS_ENABLED") === "true")) {
      await recordEmailWorkerRun({ supabaseUrl: url, serviceKey, worker: "email_programs", requestId, status: "disabled", metrics: { sent_count: 0, failure_count: 0 }, startedAt: startedAtIso, durationMs: Date.now() - startedAt });
      return json({ enabled: false, guidance_sent: 0, digests_sent: 0 }, 200, requestId);
    }
    if (!resendKey) throw new Error("missing_resend_configuration");
    if (!suppressionHashKey) throw new Error("missing_suppression_configuration");
    if (!unsubscribeSigningKey) throw new Error("missing_unsubscribe_configuration");
    const unsubscribeEndpoint = `${url}/functions/v1/email-unsubscribe`;

    let preferenceQuery = admin
      .from("notification_preferences")
      .select("user_id,timezone,getting_started_enabled,getting_started_opted_in_at,weekly_digest_enabled,weekly_digest_opted_in_at,plan_reminders_enabled,plan_reminders_opted_in_at")
      .or("getting_started_enabled.eq.true,weekly_digest_enabled.eq.true,plan_reminders_enabled.eq.true");
    if (testUserId) preferenceQuery = preferenceQuery.eq("user_id", testUserId);
    const { data: preferenceData, error: preferenceError } = await preferenceQuery.limit(MAX_USERS_PER_RUN);
    if (preferenceError) throw new Error(`preferences_query_failed:${preferenceError.code ?? "unknown"}`);
    const preferences = (preferenceData ?? []) as PreferenceRow[];
    if (preferences.length === 0) {
      await recordEmailWorkerRun({ supabaseUrl: url, serviceKey, worker: "email_programs", requestId, status: "success", metrics: { users_considered: 0, sent_count: 0, failure_count: 0, suppressed_count: 0, skipped_count: 0 }, startedAt: startedAtIso, durationMs: Date.now() - startedAt });
      return json({ enabled: true, users: 0, guidance_sent: 0, digests_sent: 0 }, 200, requestId);
    }

    const userIds = preferences.map((preference) => preference.user_id);
    const [{ data: heartData, error: heartError }, { data: vibeData, error: vibeError }, { data: deliveryData, error: deliveryError }, { data: planData, error: planError }] = await Promise.all([
      admin.from("hearted_schools").select("user_id,college_id,college_name,created_at").in("user_id", userIds).order("created_at", { ascending: false }),
      admin.from("saved_vibes").select("user_id,college_id,fit_score").in("user_id", userIds),
      admin.from("notification_deliveries").select("user_id,kind,dedupe_key,status").in("user_id", userIds).in("kind", ["getting_started", "weekly_digest", "plan_reminder"]),
      admin.from("sage_plans").select("id,user_id").in("user_id", userIds).eq("status", "active"),
    ]);
    if (heartError) throw new Error(`hearts_query_failed:${heartError.code ?? "unknown"}`);
    if (vibeError) throw new Error(`vibes_query_failed:${vibeError.code ?? "unknown"}`);
    if (deliveryError) throw new Error(`deliveries_query_failed:${deliveryError.code ?? "unknown"}`);
    if (planError) throw new Error(`plans_query_failed:${planError.code ?? "unknown"}`);

    const hearts = (heartData ?? []) as HeartRow[];
    const vibes = (vibeData ?? []) as VibeRow[];
    const deliveries = (deliveryData ?? []) as DeliveryRow[];
    const heartsByUser = new Map<string, HeartRow[]>();
    const vibesByUser = new Map<string, VibeRow[]>();
    for (const heart of hearts) heartsByUser.set(heart.user_id, [...(heartsByUser.get(heart.user_id) ?? []), heart]);
    for (const vibe of vibes) vibesByUser.set(vibe.user_id, [...(vibesByUser.get(vibe.user_id) ?? []), vibe]);
    const sentKeys = new Set(deliveries.filter((delivery) => delivery.status === "sent").map((delivery) => delivery.dedupe_key));
    const plans = (planData ?? []) as PlanRow[];
    let planTasks: PlanTaskRow[] = [];
    if (plans.length > 0) {
      const { data, error } = await admin.from("sage_plan_tasks")
        .select("id,plan_id,title,owner_role,college_name,due_date")
        .in("plan_id", plans.map((plan) => plan.id))
        .in("status", ["todo", "in_progress"])
        .not("due_date", "is", null);
      if (error) throw new Error(`plan_tasks_query_failed:${error.code ?? "unknown"}`);
      planTasks = (data ?? []) as PlanTaskRow[];
    }
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    const planTasksByUser = new Map<string, PlanTaskRow[]>();
    for (const task of planTasks) {
      const userId = planById.get(task.plan_id)?.user_id;
      if (userId) planTasksByUser.set(userId, [...(planTasksByUser.get(userId) ?? []), task]);
    }

    const collegeIds = [...new Set(hearts.map((heart) => heart.college_id))];
    let deadlineRows: DeadlineRow[] = [];
    if (collegeIds.length > 0) {
      const { data, error } = await admin.from("college_deadlines").select("college_id,deadlines,updated_at").in("college_id", collegeIds);
      if (error) throw new Error(`deadlines_query_failed:${error.code ?? "unknown"}`);
      deadlineRows = (data ?? []) as DeadlineRow[];
    }
    const deadlineByCollege = new Map(deadlineRows.map((row) => [row.college_id, row]));
    const now = new Date();
    let guidanceSent = 0;
    let digestsSent = 0;
    let planRemindersSent = 0;
    let failed = 0;
    let suppressed = 0;
    const usersSent = new Set<string>();
    const usersFailed = new Set<string>();
    const usersSuppressed = new Set<string>();

    async function sendProgramEmail(
      preference: PreferenceRow,
      kind: "getting_started" | "weekly_digest" | "plan_reminder",
      dedupeKey: string,
      from: string,
      content: EmailContent,
      unsubscribeUrl: string,
    ): Promise<"sent" | "skipped" | "failed" | "suppressed"> {
      const { data: authData, error: authError } = await admin.auth.admin.getUserById(preference.user_id);
      const email = authData?.user?.email;
      if (authError || !email) return "skipped";
      const { data: suppression, error: suppressionError } = await admin
        .from("email_suppressions")
        .select("email_hash")
        .eq("email_hash", await emailFingerprint(email, suppressionHashKey))
        .maybeSingle();
      if (suppressionError) throw new Error(`suppression_query_failed:${suppressionError.code ?? "unknown"}`);
      if (suppression) return "suppressed";

      const { data: claim, error: claimError } = await admin.rpc("claim_program_delivery", {
        p_user_id: preference.user_id,
        p_kind: kind,
        p_dedupe_key: dedupeKey,
      });
      if (claimError) throw new Error(`delivery_claim_failed:${claimError.code ?? "unknown"}`);
      const deliveryId = Array.isArray(claim) ? claim[0]?.delivery_id : null;
      if (!deliveryId) return "skipped";

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": await idempotencyKey(dedupeKey),
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: content.subject,
          html: content.html,
          text: content.text,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
      if (!resendResponse.ok) {
        await admin.from("notification_deliveries").update({
          status: "failed",
          error_code: `resend_${resendResponse.status}`,
        }).eq("id", deliveryId);
        return "failed";
      }
      const resendData = await resendResponse.json() as { id?: string };
      const { error: updateError } = await admin.from("notification_deliveries").update({
        status: "sent",
        provider_message_id: resendData.id ?? null,
        error_code: null,
        sent_at: new Date().toISOString(),
      }).eq("id", deliveryId);
      if (updateError) throw new Error(`delivery_update_failed:${updateError.code ?? "unknown"}`);
      sentKeys.add(dedupeKey);
      return "sent";
    }

    for (const preference of preferences) {
      if (!testUserId && localHour(preference.timezone, now) !== 9) continue;
      const userHearts = heartsByUser.get(preference.user_id) ?? [];
      const userVibes = vibesByUser.get(preference.user_id) ?? [];
      let sentGuidanceToday = false;

      const today = localDate(preference.timezone, now);
      if (preference.plan_reminders_enabled && today) {
        const dueTasks = (planTasksByUser.get(preference.user_id) ?? [])
          .map((task) => ({ task, leadDays: daysBetween(today, task.due_date) }))
          .filter((item): item is { task: PlanTaskRow; leadDays: 0 | 7 } =>
            item.leadDays != null && PLAN_LEAD_DAYS.has(item.leadDays)
          )
          .sort((left, right) => left.task.due_date.localeCompare(right.task.due_date) || left.task.title.localeCompare(right.task.title))
          .slice(0, MAX_PLAN_TASKS_PER_EMAIL);
        const reminderKey = `plan-reminder|${preference.user_id}|${today}`;
        if (dueTasks.length > 0 && !sentKeys.has(reminderKey)) {
          const unsubscribeUrl = await createUnsubscribeUrl(
            unsubscribeEndpoint,
            preference.user_id,
            "plan_reminders",
            unsubscribeSigningKey,
          );
          const items: PlanReminderEmailItem[] = dueTasks.map(({ task, leadDays }) => ({
            title: task.title,
            dueDate: task.due_date,
            leadDays,
            ownerRole: task.owner_role,
            collegeName: task.college_name,
          }));
          const result = await sendProgramEmail(
            preference,
            "plan_reminder",
            reminderKey,
            "Sage from admyt <reminders@youradmyt.com>",
            planReminderEmailContent(items, unsubscribeUrl),
            unsubscribeUrl,
          );
          if (result === "sent") {
            planRemindersSent += 1;
            usersSent.add(preference.user_id);
          } else if (result === "failed") {
            failed += 1;
            usersFailed.add(preference.user_id);
          } else if (result === "suppressed") {
            suppressed += 1;
            usersSuppressed.add(preference.user_id);
          }
        }
      }

      if (preference.getting_started_enabled) {
        const daysSinceOptIn = testUserId ? Number.MAX_SAFE_INTEGER : elapsedDays(preference.getting_started_opted_in_at, now);
        const stageIndex = GUIDANCE_DELAYS.findIndex((delay, index) => {
          const stage = index + 1;
          return daysSinceOptIn >= delay && !sentKeys.has(`getting-started|${preference.user_id}|${stage}`);
        });
        if (stageIndex >= 0) {
          const stage = (stageIndex + 1) as 1 | 2 | 3;
          const unsubscribeUrl = await createUnsubscribeUrl(
            unsubscribeEndpoint,
            preference.user_id,
            "getting_started",
            unsubscribeSigningKey,
          );
          const result = await sendProgramEmail(
            preference,
            "getting_started",
            `getting-started|${preference.user_id}|${stage}`,
            "Sage from admyt <guidance@youradmyt.com>",
            guidanceEmailContent(stage, { savedSchoolCount: userHearts.length, vibeCheckCount: userVibes.length }, unsubscribeUrl),
            unsubscribeUrl,
          );
          if (result === "sent") {
            guidanceSent += 1;
            sentGuidanceToday = true;
            usersSent.add(preference.user_id);
          } else if (result === "failed") {
            failed += 1;
            usersFailed.add(preference.user_id);
          } else if (result === "suppressed") {
            suppressed += 1;
            usersSuppressed.add(preference.user_id);
          }
        }
      }

      const monday = localWeekday(preference.timezone, now) === "Mon";
      if (!preference.weekly_digest_enabled || sentGuidanceToday || userHearts.length === 0 || !today || (!monday && !testUserId)) continue;
      const digestKey = `weekly-digest|${preference.user_id}|${today}`;
      if (sentKeys.has(digestKey)) continue;

      const vibeByCollege = new Map(userVibes.map((vibe) => [vibe.college_id, vibe.fit_score]));
      const digestSchools: DigestSchool[] = userHearts.slice(0, MAX_DIGEST_SCHOOLS).map((heart) => ({
        id: heart.college_id,
        name: heart.college_name,
        vibeScore: vibeByCollege.get(heart.college_id),
      }));
      const freshestAllowed = new Date(now.getTime() - FRESH_DEADLINE_DAYS * 86_400_000).toISOString();
      const digestDeadlines: DigestDeadline[] = [];
      for (const heart of userHearts) {
        const deadline = deadlineByCollege.get(heart.college_id);
        const sourceUrl = validSourceUrl(deadline?.deadlines?.source_url);
        if (!deadline || deadline.updated_at < freshestAllowed || !sourceUrl) continue;
        for (const round of deadline.deadlines?.rounds ?? []) {
          const daysAway = daysBetween(today, round.date);
          if (!round.type || daysAway == null || daysAway < 0 || daysAway > DIGEST_DEADLINE_WINDOW_DAYS) continue;
          digestDeadlines.push({ collegeName: heart.college_name, type: round.type, date: round.date, sourceUrl });
        }
      }
      digestDeadlines.sort((left, right) => left.date.localeCompare(right.date));
      const unsubscribeUrl = await createUnsubscribeUrl(
        unsubscribeEndpoint,
        preference.user_id,
        "weekly_digest",
        unsubscribeSigningKey,
      );
      const result = await sendProgramEmail(
        preference,
        "weekly_digest",
        digestKey,
        "Sage from admyt <digest@youradmyt.com>",
        weeklyDigestEmailContent({ schools: digestSchools, totalSchoolCount: userHearts.length, deadlines: digestDeadlines }, unsubscribeUrl),
        unsubscribeUrl,
      );
      if (result === "sent") {
        digestsSent += 1;
        usersSent.add(preference.user_id);
      } else if (result === "failed") {
        failed += 1;
        usersFailed.add(preference.user_id);
      } else if (result === "suppressed") {
        suppressed += 1;
        usersSuppressed.add(preference.user_id);
      }
    }

    const usersWithOutcome = new Set([...usersSent, ...usersFailed, ...usersSuppressed]);
    const skipped = Math.max(0, preferences.length - usersWithOutcome.size);

    log("info", "run_completed", {
      request_id: requestId,
      test_mode: Boolean(testUserId),
      users_considered: preferences.length,
      guidance_sent: guidanceSent,
      digests_sent: digestsSent,
      plan_reminders_sent: planRemindersSent,
      deliveries_failed: failed,
      suppressed_recipients: suppressed,
      users_skipped: skipped,
      duration_ms: Date.now() - startedAt,
    });
    await recordEmailWorkerRun({
      supabaseUrl: url,
      serviceKey,
      worker: "email_programs",
      requestId,
      status: "success",
      metrics: {
        users_considered: preferences.length,
        sent_count: guidanceSent + digestsSent + planRemindersSent,
        guidance_sent: guidanceSent,
        digests_sent: digestsSent,
        plan_reminders_sent: planRemindersSent,
        failure_count: failed,
        suppressed_count: suppressed,
        skipped_count: skipped,
        users_sent_count: usersSent.size,
      },
      startedAt: startedAtIso,
      durationMs: Date.now() - startedAt,
    });
    return json({ enabled: true, users: preferences.length, guidance_sent: guidanceSent, digests_sent: digestsSent, failed, suppressed, skipped }, 200, requestId);
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "unknown_error";
    await recordEmailWorkerRun({
      supabaseUrl: env("SUPABASE_URL"),
      serviceKey: env("SUPABASE_SERVICE_ROLE_KEY"),
      worker: "email_programs",
      requestId,
      status: "failed",
      metrics: { sent_count: 0, failure_count: 1 },
      errorCode,
      startedAt: startedAtIso,
      durationMs: Date.now() - startedAt,
    });
    log("error", "run_failed", {
      request_id: requestId,
      duration_ms: Date.now() - startedAt,
      error: errorCode,
    });
    return json({ error: "email_program_run_failed" }, 500, requestId);
  }
});
