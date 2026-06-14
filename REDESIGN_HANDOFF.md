# Admyt redesign handoff

Date: 2026-06-13

## Summary

This working tree contains a full UI redesign pass for Admyt using the two redesign HTML mockups as the visual source of truth:

- `docs/redesign/admyt-app-redesign-mockups.html`
- `docs/redesign/admyt-redesign-mockup.html`

The intent was to replace the old UI system completely across the app while preserving the existing React/Vite/Supabase/Supabase Edge Function/Vercel-oriented architecture and data behavior.

No git staging, commit, or push has been performed.

## User-approved design direction

Use the mockups as the contract, not inspiration:

- Match the mockup layout, cards, spacing, navigation, colors, typography, border radius, shadows, framed app surfaces, and responsive behavior.
- Do not leave old UI patterns in place unless there is a specific architecture reason.
- Preserve Supabase, Claude/Sage Edge Function, and Vercel architecture.
- Keep the app guest-first.
- Keep all Claude calls routed through the Supabase Edge Function, not directly from the browser.

## Major screens updated

### App shell

File:

- `src/components/layout/Layout.tsx`

Changes:

- Rebuilt the top app navigation to match the redesigned app chrome.
- Replaced old text/nav styling with the new quiet framed design.
- App wordmark is now lowercase `admyt`.
- The `y` uses the purple gradient brand treatment.
- Removed the standalone `a` icon from the header because it felt out of place against the Sage identity.
- Desktop nav uses Sage/Browse/Profile with icon treatment.
- Mobile bottom nav uses the refreshed styling.
- Kept the floating “Back to Sage” pill on non-chat pages.

### Chat / Sage home

File:

- `src/pages/Home.tsx`

Changes:

- Rebuilt the chat screen into the framed app surface from the mockup.
- Added the “Chat with Sage” frame header.
- Added the right-side `What Sage knows` panel on desktop.
- Added compact mobile behavior for the Sage memory panel.
- Rebuilt the starter prompt pills as rounded horizontal controls with icon blocks and arrows.
- Increased spacing between starter pill icons and text.
- Kept existing chat context and message sending behavior.
- Kept auth prompt behavior for saving conversation.

New supporting component:

- `src/components/sage/WhatSageKnows.tsx`

### Browse / search

File:

- `src/pages/Search.tsx`

Changes:

- Replaced the old browse/search UI with the mockup-style framed search screen.
- Added a redesigned search hero.
- Rebuilt filter pills and advanced filter panel.
- Rebuilt college result cards using `.school-card`, `.score`, `.pill`, `.btn`, and mockup card primitives.
- Preserved existing filters, sorting, match scoring, heart behavior, and navigation.
- Verified mobile stacking with no horizontal overflow.

### College detail

File:

- `src/pages/CollegeDetail.tsx`

Changes:

- Rebuilt the detail page around the mockup dark detail hero.
- Added compact stat grid in the hero.
- Added a fit card with match score and heart control.
- Rebuilt the body into a main content plus Sage sidebar layout.
- Preserved:
  - `getCollege`
  - hearting
  - match score
  - generated description flow
  - Supabase Edge Function call for description generation
  - Supabase update/cache clear for generated descriptions
  - Vibe Check navigation

### Vibe Check

File:

- `src/pages/VibeCheck.tsx`

Changes:

- Rebuilt the Vibe Check setup screen into the mockup two-column layout.
- Added gradient Vibe banner.
- Rebuilt dimension selector cards.
- Added right setup panel.
- Rebuilt results into the dark result card plus dimension cards and Sage sidebar.
- Preserved:
  - selected dimension state
  - Edge Function AI call
  - JSON parsing
  - signed-in save behavior
  - guest auth prompt
  - saved Vibe Check lookup

### Profile

File:

- `src/pages/Profile.tsx`

Changes:

- Rebuilt Profile into the mockup profile hero, timeline, and Sage sidebar layout.
- Logged-out profile now uses the same redesigned system instead of the old preview stack.
- Rebuilt sections:
  - What Sage knows
  - My Schools
  - Vibe Checks
  - My preferences
  - Profile strength
  - Sage nudges
- Rebuilt preferences modal using mockup primitives.
- Preserved Supabase reads/writes for:
  - `hearted_schools`
  - `saved_vibes`
  - `user_preferences`

### Landing page

File:

- `src/pages/Landing.tsx`

Changes:

- Reworked landing page to use the mockup as the visual source of truth.
- Rebuilt hero with Sage animated rail and product chat preview.
- Replaced old lower landing sections with mockup section architecture:
  - Sage avatar scene strip
  - How Admyt works journey panel
  - Vibe Check dark section and sample score card
  - Values grid
  - Built for students audience block
  - Final CTA/footer
- Added human Sage avatar imagery from the redesign assets.

## Shared styling / design system

Files:

- `src/styles/global.css`
- `src/styles/tokens.css`

Changes:

- Added mockup-oriented primitives:
  - `.app-frame`
  - `.frame-head`
  - `.crumb`
  - `.pill`
  - `.btn`
  - `.mock-card`
  - `.mock-soft-card`
  - `.section-pad`
  - `.search-hero`
  - `.search-layout`
  - `.school-card`
  - `.score`
  - `.detail-hero`
  - `.fit-card`
  - `.detail-body`
  - `.sage-panel`
  - `.vibe-setup`
  - `.vibe-banner`
  - `.dimension-grid`
  - `.result-card`
  - `.profile-hero`
  - `.profile-layout`
  - `.timeline`
  - landing-specific classes for the Sage scenes, journey, Vibe Check, value grid, audience, and final CTA
- Added responsive rules for desktop/tablet/mobile layouts.
- Updated design tokens to align with the redesign palette and shadows.

## New / updated UI components

New:

- `src/components/ui/AdmytButton.tsx`
- `src/components/ui/AdmytCard.tsx`
- `src/components/ui/AdmytPill.tsx`
- `src/components/sage/WhatSageKnows.tsx`

Updated:

- `src/components/sage/SageAvatar.tsx`
- `src/components/sage/SageOrb.tsx`
- `src/components/sage/SchoolCard.tsx`
- `src/components/ui/AuthModal.tsx`
- `src/components/ui/HeartButton.tsx`
- `src/components/ui/ProfileAvatar.tsx`
- `src/components/ui/ScoreRing.tsx`

## Assets added

New assets are under:

- `src/assets/sage/`

Important additions:

- `sage-orb.png`
- `sage-cutout-01.png`
- `sage-cutout-02.png`
- `sage-cutout-03.png`
- `sage-cutout-04.png`
- `sage-laptop-study.png`
- `sage-headphones-chair.png`
- `sage-park-grass-v2.png`
- `sage-quad-backpack-v2.png`
- `human-sage-01.png`
- `human-sage-02.png`
- `human-sage-03.png`
- `human-sage-04.png`
- `human-sage-05.png`
- `human-sage-06.png`
- `human-sage-07.png`
- `human-sage-08.png`

Note: the PNG assets are large. Vite build succeeds but warns about large chunks/assets. Image optimization should be a follow-up before production launch.

## Architecture preservation

### Supabase

Preserved:

- Auth model
- Guest-first behavior
- Existing tables and row-level-security assumptions
- Existing heart/saved vibe/preferences behavior
- Existing college fetch/cache behavior

### Claude / Sage Edge Function

Preserved:

- Browser calls route to the Supabase Edge Function at:
  - `supabase/functions/chat/index.ts`
- No direct Anthropic browser calls should be introduced.

Related fix:

- `src/lib/claude.ts` was updated so helper calls also route through the Supabase Edge Function instead of calling Anthropic directly.

### Vercel

No Vercel-specific architecture changes were made.

The project is not currently linked to Vercel in this local workspace:

- No `.vercel/project.json` was present during this session.
- Vercel CLI was not available in the Codex environment.

## Verification performed

Build:

```bash
npm run build
```

Result:

- TypeScript build passes.
- Vite production build passes.
- Vite warns about large PNG assets and JS chunk size.

Browser verification:

- `/`
- `/chat`
- `/search`
- `/college/110635`
- `/college/110635/vibe`
- `/profile`

Mobile sanity check:

- `/search` at `390x844`
- Result: stacked layout, no horizontal overflow.

Final polish verified:

- Header wordmark is `admyt`, lowercase.
- `y` has gradient treatment.
- The standalone `a` header mark was removed.
- Chat starter pills have more spacing between icon and text.

## Current git status snapshot

Modified files:

```text
src/components/layout/Layout.tsx
src/components/sage/SageAvatar.tsx
src/components/sage/SageOrb.tsx
src/components/sage/SchoolCard.tsx
src/components/ui/AuthModal.tsx
src/components/ui/HeartButton.tsx
src/components/ui/ProfileAvatar.tsx
src/components/ui/ScoreRing.tsx
src/lib/claude.ts
src/pages/CollegeDetail.tsx
src/pages/Home.tsx
src/pages/Landing.tsx
src/pages/Profile.tsx
src/pages/Search.tsx
src/pages/VibeCheck.tsx
src/styles/global.css
src/styles/tokens.css
```

Untracked additions observed:

```text
AGENTS.md
docs/redesign/
src/assets/
src/components/sage/WhatSageKnows.tsx
src/components/ui/AdmytButton.tsx
src/components/ui/AdmytCard.tsx
src/components/ui/AdmytPill.tsx
REDESIGN_HANDOFF.md
```

Note: `docs/redesign/` and `AGENTS.md` were present as untracked files in this Codex working tree. Confirm whether they should be committed with the redesign or excluded before pushing.

## Suggested commit

Recommended command sequence:

```bash
git status
npm run build
git add src docs/redesign AGENTS.md REDESIGN_HANDOFF.md
git commit -m "Implement full Admyt redesign"
git push
```

If `docs/redesign/` or `AGENTS.md` should not be committed, use a narrower add:

```bash
git add src REDESIGN_HANDOFF.md
git commit -m "Implement full Admyt redesign"
git push
```

## Follow-up recommendations

- Optimize/compress the new PNG assets before production deployment.
- Re-test signed-in Profile data with real Supabase user data.
- Re-test Vibe Check save flow after deployment environment variables are confirmed.
- Link Vercel project separately if deployment should happen from this repo.
