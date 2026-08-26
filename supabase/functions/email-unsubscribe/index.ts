import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.1";
import { verifyUnsubscribeToken, type OptionalEmailProgram } from "../_shared/email-unsubscribe.ts";

const programColumns: Record<OptionalEmailProgram, { enabled: string; optedInAt?: string; label: string }> = {
  deadline_reminders: { enabled: "deadline_reminders_enabled", label: "deadline reminders" },
  getting_started: { enabled: "getting_started_enabled", optedInAt: "getting_started_opted_in_at", label: "getting-started guidance" },
  weekly_digest: { enabled: "weekly_digest_enabled", optedInAt: "weekly_digest_opted_in_at", label: "weekly My Schools digest" },
};

function page(title: string, message: string, action?: string) {
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · admyt</title></head><body style="margin:0;background:#f6f4fb;font-family:Arial,sans-serif;color:#26233a"><main style="max-width:520px;margin:64px auto;padding:0 20px"><section style="background:#fff;border-radius:18px;padding:32px"><div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5754d8">adm<span style="color:#818cf8">y</span>t</div><h1 style="margin:14px 0 8px;font-size:28px">${title}</h1><p style="font-size:15px;line-height:1.65;color:#5c5870">${message}</p>${action ?? ""}<p style="margin-top:24px;font-size:13px"><a href="https://youradmyt.com/profile" style="color:#5754d8">Manage all email preferences</a></p></section></main></body></html>`, {
    status: title === "That link isn’t valid." ? 400 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const signingKey = Deno.env.get("EMAIL_UNSUBSCRIBE_SIGNING_KEY") ?? "";
  const payload = await verifyUnsubscribeToken(token, signingKey);
  if (!payload) return page("That link isn’t valid.", "Nothing was changed. Open your Profile to manage email preferences safely.");
  const program = programColumns[payload.program];

  if (req.method === "GET") {
    const action = `<form method="post"><button type="submit" name="confirm" value="1" style="margin-top:10px;padding:12px 18px;border:0;border-radius:999px;background:#5754d8;color:#fff;font-size:14px;font-weight:700;cursor:pointer">Turn off ${program.label}</button></form>`;
    return page("Turn this email off?", `You’ll stop receiving ${program.label}. You can turn it back on anytime from Profile.`, action);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return new Response("Unsubscribe is temporarily unavailable", { status: 503 });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const update: Record<string, unknown> = {
    [program.enabled]: false,
    updated_at: new Date().toISOString(),
  };
  if (program.optedInAt) update[program.optedInAt] = null;
  const { error } = await admin.from("notification_preferences").update(update).eq("user_id", payload.userId);
  if (error) return new Response("Unsubscribe is temporarily unavailable", { status: 503 });

  const body = await req.text();
  if (body.includes("List-Unsubscribe=One-Click")) {
    return new Response(null, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
  return page("You’re unsubscribed.", `${program.label.charAt(0).toUpperCase()}${program.label.slice(1)} are off. No guilt, no hoops.`);
});
