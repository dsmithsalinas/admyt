import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";
import { emailFingerprint } from "../_shared/email-fingerprint.ts";

const HANDLED_EVENTS = new Set([
  "email.delivered",
  "email.bounced",
  "email.complained",
  "email.suppressed",
  "suppression.added",
]);

interface ResendEvent {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    source_id?: string;
    to?: string[];
    email?: string;
    origin?: string;
    from?: string;
  };
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function log(
  level: "info" | "error",
  event: string,
  fields: Record<string, unknown>,
) {
  const entry = JSON.stringify({
    level,
    service: "resend-webhook",
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") console.error(entry);
  else console.log(entry);
}

function suppressionReason(event: ResendEvent): string | null {
  if (event.type === "email.bounced") return "bounce";
  if (event.type === "email.complained") return "complaint";
  if (event.type === "email.suppressed") return "provider_suppression";
  if (event.type === "suppression.added") {
    if (event.data?.origin === "bounce") return "bounce";
    if (event.data?.origin === "complaint") return "complaint";
    return "manual";
  }
  return null;
}

function recipient(event: ResendEvent): string | null {
  const value = event.type === "suppression.added"
    ? event.data?.email
    : event.data?.to?.[0];
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : null;
}

function isAdmytSender(event: ResendEvent): boolean {
  const sender = event.data?.from?.trim().toLowerCase() ?? "";
  return /(?:<|\s|^)\S+@youradmyt\.com>?$/.test(sender);
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
  const hashKey = Deno.env.get("EMAIL_SUPPRESSION_HASH_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!webhookSecret || !hashKey || !supabaseUrl || !serviceKey) {
    log("error", "configuration_missing", { duration_ms: Date.now() - startedAt });
    return json({ error: "webhook_unavailable" }, 503);
  }

  const rawBody = await req.text();
  let event: ResendEvent;
  let eventId: string;
  try {
    eventId = req.headers.get("svix-id") ?? "";
    event = new Webhook(webhookSecret).verify(rawBody, {
      "svix-id": eventId,
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }) as ResendEvent;
    if (!eventId) throw new Error("missing_event_id");
  } catch {
    log("error", "signature_invalid", { duration_ms: Date.now() - startedAt });
    return json({ error: "invalid_signature" }, 400);
  }

  if (!event.type || !HANDLED_EVENTS.has(event.type)) {
    return json({ received: true, handled: false }, 200);
  }
  const providerMessageId = event.data?.email_id ?? event.data?.source_id ?? null;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  if (event.type === "suppression.added") {
    if (!providerMessageId) return json({ received: true, handled: false }, 200);
    const { data: matchingDelivery, error: matchingError } = await admin
      .from("notification_deliveries")
      .select("id")
      .eq("provider_message_id", providerMessageId)
      .limit(1)
      .maybeSingle();
    if (matchingError) {
      log("error", "delivery_scope_check_failed", {
        error_code: matchingError.code ?? "unknown",
        duration_ms: Date.now() - startedAt,
      });
      return json({ error: "event_processing_failed" }, 500);
    }
    if (!matchingDelivery) return json({ received: true, handled: false }, 200);
  } else if (!isAdmytSender(event)) {
    return json({ received: true, handled: false }, 200);
  }

  const occurredAt = event.created_at && Number.isFinite(Date.parse(event.created_at))
    ? event.created_at
    : new Date().toISOString();
  const reason = suppressionReason(event);
  const address = reason ? recipient(event) : null;
  if (reason && !address) {
    log("error", "recipient_missing", {
      event_type: event.type,
      duration_ms: Date.now() - startedAt,
    });
    return json({ error: "invalid_event" }, 400);
  }
  const { data, error } = await admin.rpc("process_resend_delivery_event", {
    p_event_id: eventId,
    p_event_type: event.type,
    p_provider_message_id: providerMessageId,
    p_occurred_at: occurredAt,
    p_email_hash: address ? await emailFingerprint(address, hashKey) : null,
    p_suppression_reason: reason,
  });
  if (error) {
    log("error", "event_store_failed", {
      event_type: event.type,
      error_code: error.code ?? "unknown",
      duration_ms: Date.now() - startedAt,
    });
    return json({ error: "event_processing_failed" }, 500);
  }

  log("info", "event_processed", {
    event_type: event.type,
    duplicate: data === false,
    suppressed: Boolean(reason),
    duration_ms: Date.now() - startedAt,
  });
  return json({ received: true, handled: true }, 200);
});
