import { productHealth } from "./health-handler.ts";
import { collectHealth } from "./collect.ts";

Deno.serve((request: Request) => productHealth(request, Deno.env.get("ADMYT_HEALTH_TOKEN"), "admyt", () => collectHealth({
  SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_SECRET_KEYS: Deno.env.get("SUPABASE_SECRET_KEYS"),
  ANTHROPIC_DAILY_REQUEST_LIMIT: Deno.env.get("ANTHROPIC_DAILY_REQUEST_LIMIT"),
})));
