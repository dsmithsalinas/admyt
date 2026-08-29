import test from "node:test";
import assert from "node:assert/strict";
import { collectHealth } from "../supabase/functions/product-health/collect.ts";

const env = { SUPABASE_URL: "https://backend.test", SUPABASE_SERVICE_ROLE_KEY: "test-key" };
test("only operational projections are requested; successful job evidence is explicit", async () => {
  const result = await collectHealth(env, async (url, init) => {
    const path = String(url);
    assert.ok(!/select=\*|chat_messages|profiles|metrics|details/.test(path));
    assert.equal(init?.redirect, "error");
    if (path.includes("email_worker_runs")) return Response.json([{ status: "success", finished_at: new Date().toISOString() }]);
    if (path.includes("data_source_status")) return Response.json([{ record_count: 1, last_refreshed_at: new Date().toISOString() }]);
    return Response.json([]);
  });
  assert.equal(result.jobs.length, 2);
  assert.ok(result.jobs.every(job => job.lastSuccessAt !== null));
  assert.ok(Object.values(result.checks).every(Boolean));
});
test("missing worker history is not a successful run", async () => {
  const result = await collectHealth(env, async () => Response.json([]));
  assert.ok(result.jobs.every(job => job.lastSuccessAt === null));
  assert.equal(result.checks.email_programs_latest_successful, false);
  assert.equal(result.checks.catalog_current, false);
});
test("query failure is not an empty successful observation", async () => {
  await assert.rejects(collectHealth(env, async () => new Response(null, { status: 500 })));
});
