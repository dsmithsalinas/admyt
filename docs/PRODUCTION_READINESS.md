# Production readiness

This is the launch gate for Admyt. Repository checks can verify code and schema, but they cannot substitute for decisions about student privacy, legal language, production secrets, or operational ownership.

## Automated checks

- [x] Strict TypeScript production build
- [x] ESLint configuration and clean lint run
- [x] Unit tests for fit scoring and location normalization
- [x] Playwright smoke tests for landing-to-Sage navigation and Browse deep links/search
- [x] GitHub Actions quality and browser-test jobs
- [x] Daily production HTTP/title/bundle smoke workflow
- [x] Route-level code splitting
- [x] Zero known npm audit vulnerabilities at the time of the August 2026 hardening pass

## Supabase and deployment

- [x] Canonical baseline migration for all application tables
- [x] Explicit Data API grants and RLS ownership policies
- [x] Local Supabase configuration and seed placeholder
- [ ] Run `npm run db:reset` on a machine with Docker or Podman
- [x] Review `npx supabase db push --dry-run` against the linked production project
- [ ] Back up production before applying the baseline repair migration
- [x] Apply the baseline and rate-limit migrations with `npx supabase db push`
- [x] Apply the duplicate-index cleanup migration with `npx supabase db push`
- [x] Deploy `chat` with `npx supabase functions deploy chat`
- [x] Run Supabase security and performance advisors
- [x] Enable leaked-password protection in Supabase Auth settings
- [ ] Verify anonymous users cannot mutate `colleges`, `college_deadlines`, or user-owned tables

## Student trust and legal review

Do not mark these complete based on generated copy alone. The owner and qualified counsel should approve the actual policy and product behavior.

- [ ] Owner/counsel approve the drafted and linked Terms and Privacy Policy
- [x] Define supported ages and parent/guardian permission rules (13+; under 18 requires permission)
- [x] State what conversations and preferences are stored, for how long, and why
- [x] Add account deletion and student-data export
- [x] Document subprocessors and AI/data handling
- [x] Add a clear AI and college-data accuracy disclosure
- [ ] Confirm that “we never sell your data” matches contracts, analytics, and operations
- [ ] Create a security/privacy contact and incident-response path

## Data and recommendation trust

- [x] Show College Scorecard source and last-refresh date
- [x] Explain that Fit Scores are heuristic, not admissions probabilities
- [ ] Replace Vibe Check evidence-type labels with verifiable links where practical
- [ ] Add net price and financial-aid context before presenting tuition as affordability
- [x] Add a visible reminder to confirm deadlines and consequential facts on official school sites
- [ ] Validate score behavior with students before making stronger accuracy claims

## Operations

- [x] Add structured Edge Function error and latency logs
- [x] Add a global rolling Anthropic request circuit breaker
- [ ] Configure Anthropic workspace spend notifications and a hard spend limit
- [ ] Extend the scheduled production smoke test to cover the Supabase REST endpoint and a deep authenticated flow
- [ ] Define who responds to failures and how quickly
- [ ] Test restore/recovery procedures

## Product follow-up

- [ ] Add a dedicated comparison workspace only if user research shows chat comparison is insufficient
- [ ] Improve empty/error/retry states across profile and detail pages
- [ ] Run a full keyboard, screen-reader, contrast, and zoom accessibility audit
- [ ] Add privacy-conscious product analytics and an in-product feedback path
