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
- When a suppression can be correlated to an Admyt message, every optional email preference for that user is turned off automatically.

After changing the webhook, send only to Resend's provider-owned test addresses (`delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev`, and `suppressed@resend.dev`). Confirm a valid event returns HTTP 200, a replay remains HTTP 200 without a second event row, and an unsigned POST returns HTTP 400. Never manufacture a fake recipient to test bounce or complaint handling.

Monitor `run_completed` and `run_failed` events plus Resend delivery logs. A high `deliveries_failed` count, unexpected volume, or stale-source concern is a reason to set `EMAIL_REMINDERS_ENABLED=false` before investigating. The first version processes at most 500 opted-in users and refreshes at most five saved schools per invocation; add cursor-based batching before either limit becomes constraining.

## Welcome email

The frontend invokes `welcome-email` only when the authenticated user's account was created within the last 24 hours. The Edge Function independently authenticates the user and enforces that same window, checks the suppression list, then atomically claims `welcome|<user_id>` in the shared delivery ledger. Repeated sign-in events and page loads cannot create a second welcome delivery.

- `WELCOME_EMAIL_ENABLED=true` permits welcome sends. Set it to `false` for the immediate kill switch.
- `WELCOME_EMAIL_TEST_USER_ID` must remain absent in production. During controlled validation, setting it restricts the function to that single user.
- The sender is `Sage from admyt <hello@youradmyt.com>`.
- Welcome is a one-time transactional account message. It is not controlled by the optional-email preferences in Profile.

For a controlled test, create a disposable confirmed Auth user at a Resend provider-owned test address, sign in as that user, temporarily set `WELCOME_EMAIL_TEST_USER_ID`, invoke the function with the user's JWT, confirm the ledger and webhook event, then delete the user and related test rows before removing the test-user secret.

## Getting-started guidance and weekly digest

`email-programs` is a service-role-only worker invoked hourly by the `admyt-email-programs-hourly` Supabase Cron job. Each run checks the saved IANA time zone and considers a student only around 9:00 local time.

Getting-started guidance:

- Requires the independent `getting_started_enabled` opt-in.
- Sends at most three messages, eligible roughly 1, 3, and 7 days after the latest opt-in.
- Covers starting a Sage conversation, using My Schools, and using Vibe Check.
- Copy adapts to the student's current saved-school and Vibe Check counts.
- Delivery keys are permanent per user and stage, so toggling the preference does not restart a completed sequence.

Weekly My Schools digest:

- Requires the independent `weekly_digest_enabled` opt-in and at least one saved school.
- Sends Monday around 9:00 in the student's saved time zone.
- Shows up to five recently saved schools, their saved Vibe Check scores, up to three upcoming deadlines, and one suggested next step.
- Includes deadline dates only when the cache was checked within 7 days and has an HTTPS official-source link. Students are still told to confirm dates at the source.
- Delivery keys include the user's local Monday date, preventing more than one digest per week.

Shared safety behavior:

- `EMAIL_PROGRAMS_ENABLED=true` permits both programs. Set it to `false` for the immediate kill switch.
- `EMAIL_PROGRAMS_TEST_USER_ID` must remain absent in production. During controlled validation, setting it restricts the worker to one user and bypasses the local-time, weekday, and sequence-delay gates; preference and suppression checks still apply.
- The database claim rechecks the corresponding opt-in atomically immediately before delivery, closing the opt-out race after the worker's initial query.
- The worker sends at most one guidance email per user per invocation and skips that user's digest when guidance was sent in the same run.
- Guidance sends from `Sage from admyt <guidance@youradmyt.com>` and the digest sends from `Sage from admyt <digest@youradmyt.com>`.
- Both use the shared delivery ledger, three-attempt retry cap, stable Resend idempotency key, webhook status tracking, and privacy-minimized suppression list.

## One-click unsubscribe

Every optional application email—deadline reminders, getting-started guidance, and the weekly digest—contains a signed program-specific unsubscribe URL served by `email-unsubscribe`.

- The browser-facing `GET` request only shows a confirmation page. This prevents link previews and security scanners from changing a preference.
- A confirmed browser form `POST` turns off only that program and shows a success page.
- Each message also carries `List-Unsubscribe: <https://.../email-unsubscribe?token=...>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. An RFC 8058 provider `POST` performs the same opt-out immediately and returns an empty HTTP 200 response.
- Tokens contain only the user ID, program, and format version, protected by HMAC-SHA-256. They cannot enable email, read account data, or change another program without a valid signature.
- `EMAIL_UNSUBSCRIBE_SIGNING_KEY` is shared by the optional-email workers and endpoint. Keep it stable: rotation invalidates links in messages already delivered. If compromise is suspected, rotate it immediately and accept that old unsubscribe links will direct students to Profile instead.
- `email-unsubscribe` has gateway JWT verification disabled because email recipients may not have an active session. The signed token is its authorization boundary; service-role credentials never leave the function.

## Email operations monitoring

`deadline-reminders` and `email-programs` write one aggregate row to `email_worker_runs` for every authenticated invocation, including disabled and zero-recipient runs. Rows contain the worker name, request ID, status, duration, and aggregate counters only—never recipient addresses, subjects, or message content. `admyt-email-worker-run-cleanup` removes rows older than 90 days each Sunday.

`email-health` is a public-network endpoint protected by the dedicated bearer secret `EMAIL_OPERATIONS_MONITOR_TOKEN`. It returns HTTP 503 when:

- `email-programs` has not recorded a run within 2 hours;
- `deadline-reminders` has not recorded a run within 27 hours;
- the latest run failed or reported any delivery failures; or
- a worker exceeded `EMAIL_OPERATIONS_MAX_SENDS_PER_RUN` in one invocation (default 100).

`.github/workflows/email-operations.yml` calls the endpoint at minute 37 every hour and fails on any HTTP 503. GitHub Actions failure notifications are the external alert path, so a Supabase Cron-wide outage remains detectable. Keep the same random `EMAIL_OPERATIONS_MONITOR_TOKEN` in Supabase Edge Function secrets and the GitHub Actions repository secret. The endpoint never returns addresses or message content.

## Email operations console

The authenticated `/admin` route is the internal system-health overview. It reports four signals already recorded by Admyt: the rolling Sage AI request budget, College Scorecard record count and refresh age, hourly guidance/digest worker health, and daily deadline-reminder worker health. The page is read-only and returns no student identifiers or message content.

`/email-operations` is the first linked admin module. It previews the same shared renderers used by the production workers, can send a selected template to the signed-in administrator's own address, and shows opt-in counts, recent worker runs, delivery status, webhook activity, and suppression totals.

`/admin/data-quality` is the deadline review queue. It aggregates saved-school rows by college and reports records that are missing deadlines, missing an HTTPS official source, or older than the seven-day verification window required for application email. An administrator can request a fresh AI/web-search result, but that result is stored as an expiring private preview and does not replace the shared cache until the administrator reviews its dates and HTTPS source and explicitly accepts it.

`/admin/support` performs a read-only, exact-email account lookup. It returns Auth timestamps, feature counts, notification preferences, suppression state, and the last 10 privacy-minimized delivery outcomes. It never returns chat text, Sage profile answers, saved-school names, Vibe Check content, provider message IDs, or a browsable user directory.

`/admin/incidents` provides database-backed controls for welcome emails, deadline reminders, and guidance/digest messages. A program sends only when both its existing environment switch and its database control are enabled. The same page can publish a 240-character maintenance notice above the application navigation. Confirm each change in the UI; controls take effect on the next worker invocation.

`/admin/audit` shows the most recent privacy-minimized admin actions. Support lookups, email test sends, deadline previews and acceptance, incident changes, maintenance changes, and audit-log views are recorded. Audit rows expire after 365 days; unused deadline previews are pruned after they expire.

Access is enforced inside the `email-operations` Edge Function. The frontend route is not an authorization boundary. Set a comma-separated allowlist using the exact email addresses of authorized Supabase Auth accounts:

```bash
npx supabase secrets set EMAIL_OPERATIONS_ADMIN_EMAILS="owner@example.com" --project-ref bwegkzzeiasdbuwatglc
npx supabase functions deploy email-operations
```

- The function verifies the caller's Supabase user JWT and compares the verified Auth email against the server-side allowlist. It never uses editable user metadata for authorization.
- Test sends always go to that verified administrator address. The request cannot supply a recipient, sender, subject, or HTML.
- Preview content uses bounded sample data and a sandboxed iframe. It does not load a student's account data.
- Aggregate dashboard responses omit recipient addresses, user IDs, provider message IDs, and suppression hashes. The exact-email support tool returns only the single requested account and records the lookup by user ID in the audit log.
- The Resend API key and Supabase service-role key remain inside the Edge Function.
- Keep both routes out of normal student navigation. Authorized operators can bookmark `https://youradmyt.com/admin`; signed-out and unauthorized visitors receive a generic denial page that does not identify the internal tools.

## Deployment order

```bash
npx supabase db push --dry-run
npx supabase db push
npx supabase functions deploy chat
npx supabase functions deploy account
npx supabase functions deploy deadline-reminders
npx supabase functions deploy resend-webhook --no-verify-jwt
npx supabase functions deploy welcome-email
npx supabase functions deploy email-programs
npx supabase functions deploy email-unsubscribe --no-verify-jwt
npx supabase functions deploy email-health --no-verify-jwt
npx supabase functions deploy email-operations
npm run check
npm run test:e2e
```

The database migration must be applied before deploying the updated welcome, reminder, guidance/digest, or email-operations functions. Until the migration exists, the new database runtime controls intentionally fail closed.

After deployment, test account export with a non-production user. Test deletion only with a disposable account, then confirm its application rows and Auth user are gone.
