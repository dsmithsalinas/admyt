# Admyt operations runbook

## Edge Function monitoring

The `chat`, `account`, `deadline-reminders`, and `resend-webhook` Edge Functions write single-line JSON events to Supabase logs. Chat completion events include a random request ID, request type, HTTP status, duration in milliseconds, and rolling AI-budget counts. Reminder runs and webhooks report aggregate delivery state only. They intentionally omit prompts, IP addresses, emails, user IDs, webhook bodies, and API response bodies.

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

## Authentication provider setup

The repository configures passwordless email codes and Apple OAuth locally, but hosted Auth settings and provider secrets must be managed outside Git.

### Passwordless email codes

Verified in production on 2026-08-25:

- Resend custom SMTP is enabled in Supabase Auth.
- `youradmyt.com` is verified in Resend.
- Sender: `Sage from admyt <sign-in@youradmyt.com>`.
- SMTP host: `smtp.resend.com`; credentials remain dashboard-managed and must never be committed.
- The Magic Link / OTP subject is `Your admyt sign-in code`.
- OTP length is 6 digits, expiration is 600 seconds, and the minimum resend interval is 60 seconds.
- The hosted Magic Link / OTP body matches `supabase/templates/sign-in-code.html`.
- Resend delivery logs confirmed successful sign-in-code delivery.

When changing email authentication:

1. Keep `supabase/templates/sign-in-code.html` as the source of truth. Under **Authentication → Emails → Magic Link or OTP**, copy the complete HTML into the hosted template and keep the subject `Your admyt sign-in code`.
2. The template must contain `{{ .Token }}`; using only `{{ .ConfirmationURL }}` sends a link instead of the code the UI expects.
3. Keep the Email provider settings aligned with the UI: OTP length 6, expiration 600 seconds, and minimum resend frequency 60 seconds.
4. After any SMTP, template, DNS, or Auth change, send and verify a code with a non-production user, then confirm delivery in Resend and successful verification in Admyt.

For Apple OAuth:

1. In Apple Developer, create and configure the Admyt Services ID, website domain, and Sign in with Apple key.
2. Register `https://bwegkzzeiasdbuwatglc.supabase.co/auth/v1/callback` as the return URL.
3. In **Supabase → Authentication → Providers → Apple**, enable Apple and enter the Services ID and generated client secret.
4. Verify `https://youradmyt.vercel.app` is the Auth Site URL or an allowed redirect URL.
5. Set `VITE_APPLE_AUTH_ENABLED=true` in Vercel and redeploy. The button stays hidden until this flag is enabled, so incomplete provider setup does not create a broken login option.
6. Rotate the Apple web client secret before its six-month expiration and immediately run a production Apple sign-in smoke test.

Never commit SMTP credentials, the Apple `.p8` key, or generated Apple client secrets.

## Deadline reminder emails

Deadline reminders are explicit opt-in. The sender only considers fixed deadlines that are exactly 30 or 7 days away in the user's saved time zone, have an HTTPS official-source link, and were checked within the last 7 days. Delivery claims are atomic, retries are capped at three, and Resend receives a stable idempotency key.

Production configuration:

- `admyt-deadline-reminders-daily` runs at `0 15 * * *` (15:00 UTC) through Supabase Cron.
- The Cron request reads `admyt_project_url` and `admyt_service_role_key` from Supabase Vault and invokes `/functions/v1/deadline-reminders` with a 120-second timeout.
- Each run refreshes at most five missing or stale saved-school deadline records. Forced refresh is accepted only from a gateway-verified service-role JWT; normal frontend lookups keep the longer cache window.
- `VITE_DEADLINE_EMAILS_ENABLED=true` exposes the Profile opt-in. Set it to `false` and redeploy to prevent new opt-ins.
- `EMAIL_REMINDERS_ENABLED=true` permits sends. Set this Edge Function secret to `false` for the immediate delivery kill switch.
- `EMAIL_REMINDERS_TEST_USER_ID` must remain absent in production. If it is temporarily set during controlled validation, every other user is ignored.

Resend delivery tracking:

- Endpoint: `https://bwegkzzeiasdbuwatglc.supabase.co/functions/v1/resend-webhook`.
- Subscribe only to `email.delivered`, `email.bounced`, `email.complained`, `email.suppressed`, and `suppression.added`.
- Store the endpoint signing secret as the Supabase Edge Function secret `RESEND_WEBHOOK_SECRET`. Never reuse the Resend API key as the webhook secret.
- `resend-webhook` has gateway JWT verification disabled because Resend does not send a Supabase JWT. The function instead verifies the raw body and `svix-id`, `svix-timestamp`, and `svix-signature` headers before any database write.
- Event IDs are inserted atomically and duplicate deliveries become no-ops. Raw webhook payloads, recipient addresses, and subjects are not stored.
- The Resend account is shared with other products. Email events are ignored unless the sender is on `youradmyt.com`; `suppression.added` is ignored unless its source message ID already exists in Admyt's notification ledger.
- Hard bounces, complaints, provider suppressions, and Resend suppression additions create or refresh an `email_suppressions` row keyed by an HMAC-SHA-256 fingerprint of the lowercase address. The reminder worker checks this table before claiming a delivery. `EMAIL_SUPPRESSION_HASH_KEY` is the shared Edge Function secret used for that fingerprint; rotate it only with a migration plan for existing suppression rows.
- When a suppression can be correlated to a reminder message, the user's deadline opt-in is turned off automatically.

After changing the webhook, send only to Resend's provider-owned test addresses (`delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev`, and `suppressed@resend.dev`). Confirm a valid event returns HTTP 200, a replay remains HTTP 200 without a second event row, and an unsigned POST returns HTTP 400. Never manufacture a fake recipient to test bounce or complaint handling.

Monitor `run_completed` and `run_failed` events plus Resend delivery logs. A high `deliveries_failed` count, unexpected volume, or stale-source concern is a reason to set `EMAIL_REMINDERS_ENABLED=false` before investigating. The first version processes at most 500 opted-in users and refreshes at most five saved schools per invocation; add cursor-based batching before either limit becomes constraining.

## Deployment order

```bash
npx supabase db push --dry-run
npx supabase db push
npx supabase functions deploy chat
npx supabase functions deploy account
npx supabase functions deploy deadline-reminders
npx supabase functions deploy resend-webhook --no-verify-jwt
npm run check
npm run test:e2e
```

After deployment, test account export with a non-production user. Test deletion only with a disposable account, then confirm its application rows and Auth user are gone.
