import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.1";
import { emailFingerprint } from "../_shared/email-fingerprint.ts";
import { createUnsubscribeUrl } from "../_shared/email-unsubscribe.ts";
import { recordEmailWorkerRun } from "../_shared/email-worker-run.ts";
import { deadlineReminderEmailContent } from "../_shared/deadline-email-content.ts";

const MAX_USERS_PER_RUN = 500;
const MAX_CACHE_AGE_DAYS = 7;
const MAX_DEADLINE_REFRESHES_PER_RUN = 5;
const LEAD_DAYS = new Set([7, 30]);
interface PreferenceRow {
  user_id: string;
  timezone: string;
}
interface HeartRow {
  user_id: string;
  college_id: string;
  college_name: string;
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
interface Reminder {
  dedupeKey: string;
  collegeId: string;
  collegeName: string;
  deadlineType: string;
  deadlineDate: string;
  leadDays: number;
  sourceUrl: string;
  verifiedAt: string;
}

async function refreshDeadline(
  supabaseUrl: string,
  serviceKey: string,
  collegeId: string,
): Promise<DeadlineRow | null> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "deadline", collegeId, forceRefresh: true }),
    });
    if (!response.ok) return null;
    const body = await response.json() as { deadlines?: DeadlineRow["deadlines"] };
    if (!body.deadlines) return null;
    return { college_id: collegeId, deadlines: body.deadlines, updated_at: new Date().toISOString() };
  } catch {
    return null;
  }
}

function env(key: string): string {
  return Deno.env.get(key) ?? "";
}
function hasVerifiedServiceRole(
  authHeader: string | null,
  supabaseUrl: string,
): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    // config.toml keeps verify_jwt enabled, so the gateway has already verified
    // the signature. Check the signed claims instead of comparing one specific
    // service-role token, because Supabase can rotate or reissue that token.
    const token = authHeader.slice("Bearer ".length);
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return false;
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { role?: string; ref?: string };
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    return payload.role === "service_role" && payload.ref === projectRef;
  } catch {
    return false;
  }
}
function json(body: unknown, status: number, requestId: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "X-Request-Id": requestId },
  });
}
function log(
  level: "info" | "error",
  event: string,
  fields: Record<string, unknown>,
) {
  const entry = JSON.stringify({
    level,
    service: "deadline-reminders",
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") console.error(entry);
  else console.log(entry);
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
function localDate(timezone: string, now: Date): string | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return null;
  }
}
function daysBetween(fromIso: string, toIso: string): number | null {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return Math.round((to - from) / 86_400_000);
}
async function idempotencyKey(
  userId: string,
  reminders: Reminder[],
): Promise<string> {
  const source = `${userId}|${
    reminders.map((item) => item.dedupeKey).sort().join("|")
  }`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source),
  );
  return `deadline-reminder/${
    Array.from(new Uint8Array(digest)).map((byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("")
  }`;
}

Deno.serve(async (req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  const startedAtIso = new Date(startedAt).toISOString();
  try {
    if (req.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405, requestId);
    }
    const url = env("SUPABASE_URL");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = env("RESEND_API_KEY");
    const suppressionHashKey = env("EMAIL_SUPPRESSION_HASH_KEY");
    const unsubscribeSigningKey = env("EMAIL_UNSUBSCRIBE_SIGNING_KEY");
    const testUserId = env("EMAIL_REMINDERS_TEST_USER_ID");
    if (!url || !serviceKey) throw new Error("missing_supabase_configuration");
    if (!hasVerifiedServiceRole(req.headers.get("Authorization"), url)) {
      return json({ error: "unauthorized" }, 401, requestId);
    }
    if (env("EMAIL_REMINDERS_ENABLED") !== "true") {
      log("info", "run_disabled", {
        request_id: requestId,
        duration_ms: Date.now() - startedAt,
      });
      await recordEmailWorkerRun({ supabaseUrl: url, serviceKey, worker: "deadline_reminders", requestId, status: "disabled", metrics: { sent_count: 0, failure_count: 0 }, startedAt: startedAtIso, durationMs: Date.now() - startedAt });
      return json({ enabled: false, sent: 0 }, 200, requestId);
    }
    if (!resendKey) throw new Error("missing_resend_configuration");
    if (!suppressionHashKey) throw new Error("missing_suppression_configuration");
    if (!unsubscribeSigningKey) throw new Error("missing_unsubscribe_configuration");
    const unsubscribeEndpoint = `${url}/functions/v1/email-unsubscribe`;

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    let preferencesQuery = admin
      .from("notification_preferences").select("user_id,timezone")
      .eq("deadline_reminders_enabled", true);
    if (testUserId) {
      preferencesQuery = preferencesQuery.eq("user_id", testUserId);
    }
    const { data: preferences, error: preferencesError } =
      await preferencesQuery
        .limit(MAX_USERS_PER_RUN);
    if (preferencesError) {
      throw new Error(
        `preferences_query_failed:${preferencesError.code ?? "unknown"}`,
      );
    }
    const enabled = (preferences ?? []) as PreferenceRow[];
    if (enabled.length === 0) {
      await recordEmailWorkerRun({ supabaseUrl: url, serviceKey, worker: "deadline_reminders", requestId, status: "success", metrics: { users_considered: 0, sent_count: 0, failure_count: 0, suppressed_count: 0, skipped_count: 0 }, startedAt: startedAtIso, durationMs: Date.now() - startedAt });
      return json({ enabled: true, users: 0, sent: 0 }, 200, requestId);
    }

    const { data: hearts, error: heartsError } = await admin
      .from("hearted_schools").select("user_id,college_id,college_name")
      .in("user_id", enabled.map((row) => row.user_id));
    if (heartsError) {
      throw new Error(`hearts_query_failed:${heartsError.code ?? "unknown"}`);
    }
    const heartRows = (hearts ?? []) as HeartRow[];
    const collegeIds = [...new Set(heartRows.map((row) => row.college_id))];
    if (collegeIds.length === 0) {
      await recordEmailWorkerRun({ supabaseUrl: url, serviceKey, worker: "deadline_reminders", requestId, status: "success", metrics: { users_considered: enabled.length, sent_count: 0, failure_count: 0, suppressed_count: 0, skipped_count: enabled.length }, startedAt: startedAtIso, durationMs: Date.now() - startedAt });
      return json(
        { enabled: true, users: enabled.length, sent: 0 },
        200,
        requestId,
      );
    }

    const freshestAllowed = new Date(
      Date.now() - MAX_CACHE_AGE_DAYS * 86_400_000,
    ).toISOString();
    const { data: deadlineData, error: deadlinesError } = await admin
      .from("college_deadlines").select("college_id,deadlines,updated_at")
      .in("college_id", collegeIds);
    if (deadlinesError) {
      throw new Error(
        `deadlines_query_failed:${deadlinesError.code ?? "unknown"}`,
      );
    }
    const deadlineByCollege = new Map(
      ((deadlineData ?? []) as DeadlineRow[]).map(
        (row) => [row.college_id, row],
      ),
    );
    const refreshTargets = collegeIds
      .filter((collegeId) => {
        const record = deadlineByCollege.get(collegeId);
        return !record || record.updated_at < freshestAllowed;
      })
      .sort((left, right) => {
        const leftUpdated = deadlineByCollege.get(left)?.updated_at ?? "";
        const rightUpdated = deadlineByCollege.get(right)?.updated_at ?? "";
        return leftUpdated.localeCompare(rightUpdated);
      })
      .slice(0, MAX_DEADLINE_REFRESHES_PER_RUN);
    let refreshSucceeded = 0;
    for (const collegeId of refreshTargets) {
      const refreshed = await refreshDeadline(url, serviceKey, collegeId);
      if (refreshed) {
        deadlineByCollege.set(collegeId, refreshed);
        refreshSucceeded += 1;
      }
    }
    const heartsByUser = new Map<string, HeartRow[]>();
    for (const heart of heartRows) {
      heartsByUser.set(heart.user_id, [
        ...(heartsByUser.get(heart.user_id) ?? []),
        heart,
      ]);
    }

    let sent = 0;
    let failed = 0;
    let claimed = 0;
    let suppressed = 0;
    let usersSent = 0;
    let usersFailed = 0;
    const now = new Date();
    for (const preference of enabled) {
      const today = localDate(preference.timezone, now);
      if (!today) continue;
      const candidates: Reminder[] = [];
      for (const heart of heartsByUser.get(preference.user_id) ?? []) {
        const record = deadlineByCollege.get(heart.college_id);
        const sourceUrl = validSourceUrl(record?.deadlines?.source_url);
        if (!record || record.updated_at < freshestAllowed || !sourceUrl) continue;
        for (const round of record.deadlines?.rounds ?? []) {
          if (!round?.type || !/^\d{4}-\d{2}-\d{2}$/.test(round.date)) continue;
          const leadDays = daysBetween(today, round.date);
          if (leadDays == null || !LEAD_DAYS.has(leadDays)) continue;
          candidates.push({
            dedupeKey: [
              preference.user_id,
              heart.college_id,
              round.type,
              round.date,
              leadDays,
            ].join("|"),
            collegeId: heart.college_id,
            collegeName: heart.college_name,
            deadlineType: round.type,
            deadlineDate: round.date,
            leadDays,
            sourceUrl,
            verifiedAt: record.updated_at,
          });
        }
      }
      if (candidates.length === 0) continue;

      const { data: authData, error: authError } = await admin.auth.admin
        .getUserById(preference.user_id);
      const email = authData?.user?.email;
      if (authError || !email) {
        continue;
      }
      const { data: suppression, error: suppressionError } = await admin
        .from("email_suppressions")
        .select("email_hash")
        .eq("email_hash", await emailFingerprint(email, suppressionHashKey))
        .maybeSingle();
      if (suppressionError) {
        throw new Error(
          `suppression_query_failed:${suppressionError.code ?? "unknown"}`,
        );
      }
      if (suppression) {
        suppressed += 1;
        continue;
      }

      const reserved: Array<Reminder & { deliveryId: string }> = [];
      for (const reminder of candidates) {
        const { data, error } = await admin.rpc("claim_notification_delivery", {
          p_user_id: preference.user_id,
          p_dedupe_key: reminder.dedupeKey,
          p_college_id: reminder.collegeId,
          p_college_name: reminder.collegeName,
          p_deadline_type: reminder.deadlineType,
          p_deadline_date: reminder.deadlineDate,
          p_lead_days: reminder.leadDays,
          p_source_url: reminder.sourceUrl,
          p_deadline_verified_at: reminder.verifiedAt,
        });
        if (error) {
          throw new Error(`delivery_claim_failed:${error.code ?? "unknown"}`);
        }
        const deliveryId = Array.isArray(data) ? data[0]?.delivery_id : null;
        if (deliveryId) reserved.push({ ...reminder, deliveryId });
      }
      if (reserved.length === 0) continue;
      claimed += reserved.length;

      const unsubscribeUrl = await createUnsubscribeUrl(
        unsubscribeEndpoint,
        preference.user_id,
        "deadline_reminders",
        unsubscribeSigningKey,
      );
      const content = deadlineReminderEmailContent(reserved, unsubscribeUrl);
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": await idempotencyKey(preference.user_id, reserved),
        },
        body: JSON.stringify({
          from: "Sage from admyt <reminders@youradmyt.com>",
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
        }).in("id", reserved.map((item) => item.deliveryId));
        failed += reserved.length;
        usersFailed += 1;
        continue;
      }

      const resendData = await resendResponse.json() as { id?: string };
      const { error: updateError } = await admin.from("notification_deliveries")
        .update({
          status: "sent",
          provider_message_id: resendData.id ?? null,
          error_code: null,
          sent_at: new Date().toISOString(),
        }).in("id", reserved.map((item) => item.deliveryId));
      if (updateError) {
        throw new Error(
          `delivery_update_failed:${updateError.code ?? "unknown"}`,
        );
      }
      sent += reserved.length;
      usersSent += 1;
    }

    const skipped = Math.max(0, enabled.length - usersSent - usersFailed - suppressed);

    log("info", "run_completed", {
      request_id: requestId,
      test_mode: Boolean(testUserId),
      deadline_refreshes_attempted: refreshTargets.length,
      deadline_refreshes_succeeded: refreshSucceeded,
      users_considered: enabled.length,
      deliveries_claimed: claimed,
      deliveries_sent: sent,
      deliveries_failed: failed,
      suppressed_recipients: suppressed,
      users_skipped: skipped,
      duration_ms: Date.now() - startedAt,
    });
    await recordEmailWorkerRun({
      supabaseUrl: url,
      serviceKey,
      worker: "deadline_reminders",
      requestId,
      status: "success",
      metrics: {
        users_considered: enabled.length,
        sent_count: sent,
        failure_count: failed,
        suppressed_count: suppressed,
        skipped_count: skipped,
        users_sent_count: usersSent,
        deliveries_claimed: claimed,
        deadline_refreshes_attempted: refreshTargets.length,
        deadline_refreshes_succeeded: refreshSucceeded,
      },
      startedAt: startedAtIso,
      durationMs: Date.now() - startedAt,
    });
    return json(
      { enabled: true, users: enabled.length, claimed, sent, failed, suppressed, skipped },
      200,
      requestId,
    );
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "unknown_error";
    await recordEmailWorkerRun({
      supabaseUrl: env("SUPABASE_URL"),
      serviceKey: env("SUPABASE_SERVICE_ROLE_KEY"),
      worker: "deadline_reminders",
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
    return json({ error: "deadline_reminder_run_failed" }, 500, requestId);
  }
});
