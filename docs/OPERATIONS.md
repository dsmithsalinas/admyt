# Admyt operations runbook

## Edge Function monitoring

The `chat` and `account` Edge Functions write single-line JSON events to Supabase logs. Chat completion events include a random request ID, request type, HTTP status, duration in milliseconds, and rolling AI-budget counts. They intentionally omit prompts, IP addresses, emails, user IDs, and API response bodies.

In Supabase, open **Edge Functions → chat → Logs**. Investigate repeated `request_failed`, `anthropic_upstream_error`, `anthropic_stream_error`, or `ai_budget_exhausted` events. Use `request_id` to group one request's events. The account function uses the same redaction rule.

## Anthropic cost controls

The database function `consume_ai_request_budget` and `ANTHROPIC_DAILY_REQUEST_LIMIT` secret impose a rolling 24-hour request ceiling before each Anthropic call. The default is 100. Deadline searches can make more than one API call, and each call consumes one unit.

After deploying the migration and function, set the production ceiling:

```bash
npx supabase secrets set ANTHROPIC_DAILY_REQUEST_LIMIT=100 --project-ref bwegkzzeiasdbuwatglc
```

This request guard is not a dollar-denominated guarantee. In the Anthropic Console, open the Admyt workspace limits and configure:

1. A monthly hard spend limit that matches the product budget.
2. Spend notifications below the hard limit so there is time to investigate.
3. Billing-alert access for the person responsible for incidents.

## Backup status and restore drill

Verified on 2026-08-14: the production project had eight completed physical daily backups, Write-Ahead Log archiving enabled, and Point-in-Time Recovery disabled. The plan provides daily recovery points; do not assume minute-level recovery.

Run a restore drill before launch and after material schema changes:

1. In **Database → Backups**, select a recent backup and restore it to a new, non-production project.
2. Never use the live production project as the drill target.
3. Compare key table counts (`colleges`, `chat_messages`, `hearted_schools`, `saved_vibes`, and `user_preferences`) and inspect recent rows.
4. Verify authentication, RLS policies, migrations, function deployments, secrets, and dashboard-managed Auth settings separately.
5. Record recovery time, manual steps, and the person who approved the result.

Database backups do not restore Supabase Storage objects. Admyt does not currently depend on Storage, but add a separate object-backup procedure before introducing uploads.

## Deployment order

```bash
npx supabase db push --dry-run
npx supabase db push
npx supabase functions deploy chat
npx supabase functions deploy account
npm run check
npm run test:e2e
```

After deployment, test account export with a non-production user. Test deletion only with a disposable account, then confirm its application rows and Auth user are gone.
