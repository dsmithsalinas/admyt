import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.1";
import { emailFingerprint } from "../_shared/email-fingerprint.ts";
import { welcomeEmailContent } from "../_shared/welcome-email-content.ts";

const NEW_ACCOUNT_WINDOW_MS = 24 * 60 * 60 * 1000;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function env(key: string): string {
  return Deno.env.get(key) ?? "";
}
function response(body: unknown, status: number, requestId: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
  });
}
function log(level: "info" | "error", event: string, fields: Record<string, unknown>) {
  const entry = JSON.stringify({
    level,
    service: "welcome-email",
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") console.error(entry);
  else console.log(entry);
}
async function idempotencyKey(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `welcome/${hash}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const startedAt = Date.now();
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405, requestId);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return response({ error: "unauthorized" }, 401, requestId);

    const url = env("SUPABASE_URL");
    const anonKey = env("SUPABASE_ANON_KEY");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = env("RESEND_API_KEY");
    const suppressionHashKey = env("EMAIL_SUPPRESSION_HASH_KEY");
    if (!url || !anonKey || !serviceKey) throw new Error("missing_server_configuration");

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return response({ error: "unauthorized" }, 401, requestId);

    const testUserId = env("WELCOME_EMAIL_TEST_USER_ID");
    const createdAt = Date.parse(user.created_at);
    const isNewAccount = Number.isFinite(createdAt) && Date.now() - createdAt <= NEW_ACCOUNT_WINDOW_MS;
    if (!isNewAccount || (testUserId && testUserId !== user.id)) {
      return response({ eligible: false, sent: false }, 200, requestId);
    }
    if (env("WELCOME_EMAIL_ENABLED") !== "true") {
      return response({ eligible: true, enabled: false, sent: false }, 200, requestId);
    }
    if (!resendKey) throw new Error("missing_resend_configuration");
    if (!suppressionHashKey) throw new Error("missing_suppression_configuration");
    if (!user.email) return response({ eligible: false, sent: false }, 200, requestId);

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: suppression, error: suppressionError } = await admin
      .from("email_suppressions")
      .select("email_hash")
      .eq("email_hash", await emailFingerprint(user.email, suppressionHashKey))
      .maybeSingle();
    if (suppressionError) throw new Error(`suppression_query_failed:${suppressionError.code ?? "unknown"}`);
    if (suppression) return response({ eligible: true, suppressed: true, sent: false }, 200, requestId);

    const { data: claim, error: claimError } = await admin.rpc("claim_welcome_delivery", {
      p_user_id: user.id,
    });
    if (claimError) throw new Error(`delivery_claim_failed:${claimError.code ?? "unknown"}`);
    const deliveryId = Array.isArray(claim) ? claim[0]?.delivery_id : null;
    if (!deliveryId) return response({ eligible: true, duplicate: true, sent: false }, 200, requestId);

    const content = welcomeEmailContent();
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": await idempotencyKey(user.id),
      },
      body: JSON.stringify({
        from: "Sage from admyt <hello@youradmyt.com>",
        to: [user.email],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
    });
    if (!resendResponse.ok) {
      await admin.from("notification_deliveries").update({
        status: "failed",
        error_code: `resend_${resendResponse.status}`,
      }).eq("id", deliveryId);
      return response({ error: "welcome_email_send_failed" }, 502, requestId);
    }

    const resendData = await resendResponse.json() as { id?: string };
    const { error: updateError } = await admin.from("notification_deliveries").update({
      status: "sent",
      provider_message_id: resendData.id ?? null,
      error_code: null,
      sent_at: new Date().toISOString(),
    }).eq("id", deliveryId);
    if (updateError) throw new Error(`delivery_update_failed:${updateError.code ?? "unknown"}`);

    log("info", "welcome_sent", {
      request_id: requestId,
      test_mode: Boolean(testUserId),
      duration_ms: Date.now() - startedAt,
    });
    return response({ eligible: true, sent: true }, 200, requestId);
  } catch (error) {
    log("error", "welcome_failed", {
      request_id: requestId,
      duration_ms: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return response({ error: "welcome_email_failed" }, 500, requestId);
  }
});
