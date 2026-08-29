# Protected product health

GET /functions/v1/product-health. Reads only status/timestamps from email_worker_runs, catalog refresh metadata, and the global AI budget counter. Limits mirror existing operations checks: email programs 120 minutes, deadline reminders 27 hours, catalog 90 days, AI warning at 80% of configured daily request limit (default 100). A disabled worker is not falsely represented as successful.

Tests: `node --test tests/product-health*.contract.mts`; `npm run check`. Deno: `npx deno check --no-config --no-lock --node-modules-dir=none supabase/functions/product-health/index.ts`. Deploy only this function to project bwegkzzeiasdbuwatglc with JWT verification disabled: custom authentication occurs in the handler. Existing email-health, worker functions and GitHub workflows are unchanged.

Authorization: Bearer token from hosted runtime secret `ADMYT_HEALTH_TOKEN`, matching the same named GitHub Actions secret in product-health-agent. Never reuse other credentials or commit token values.

The endpoint performs no writes. It returns schemaVersion 1 with deterministic status, observedAt, checks, jobs and metrics. Missing runtime configuration or collection failure returns generic 503; invalid credentials return 401 before any backend access; non-GET returns 405. Every response is no-store. Valid observations use HTTP 200 even when status is degraded/fail so the agent retains the evidence. Errors and raw rows are never logged or returned.

