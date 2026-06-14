# Admyt Complete Redesign Implementation Brief

This brief captures the approved Admyt redesign direction for the landing page, logged-in app, logged-out states, login/signup, and all core product screens. It is written so Codex, Claude Code, or an engineer can implement the redesign without losing the current architecture.

Do not replace the product architecture. This is a visual/product-system rebuild on top of the existing React/Vite/Supabase/Claude/Vercel app.

## Source References

Use these as the creative and product source of truth:

- `admyt-brand-story.md`
- `admyt-landing-page-copy.md`
- `admyt-copy-voice-pass.md`
- `sage-personality-guide.md`
- `CLAUDE.md`
- Current prototype: `outputs/admyt-app-redesign-mockups.html`
- Landing prototype: `outputs/admyt-redesign-mockup.html`
- Sage hero animation prototype: `outputs/sage-hero-animation-mockup.html`

## Brand Direction

Admyt is not a rankings tool. It is a fit-first college search experience powered by Sage.

The product should feel like:

- A guided conversation, not a database with a chatbot attached.
- Warm, useful, and honest.
- Built around the student, not prestige.
- Calm enough for a stressed high schooler, but polished enough to feel credible.

Core brand hierarchy:

- Primary promise: `Find where you fit.`
- Brand signature: `The y is for you.`
- Core advisor: `Sage`
- Core feature: `Vibe Check`
- Saved knowledge area: `What Sage knows`

Keep “fit” as the brand promise. Use “Vibe Check” as the feature that delivers a real read on campus culture.

## Sage Identity

Use the Sage orb as the in-app identity everywhere Sage appears.

In-app Sage representation:

- Primary: orb with lowercase `s`.
- The orb should feel alive, warm, and lightly animated where appropriate.
- Do not use a fixed human Sage face inside the core product UI.

Human Sage avatars:

- Use on landing page, social, marketing, onboarding moments, and brand storytelling.
- Do not make them the default in-app assistant identity.
- If used in-app at all, keep them secondary and contextual, not as the main Sage identity.

## Visual System

Refresh the existing palette without breaking brand recognition.

Recommended tokens:

```css
:root {
  --admyt-ink: #171722;
  --admyt-slate: #3c3c4f;
  --admyt-muted: #77768d;
  --admyt-faint: #aaa8bd;
  --admyt-line: #e8e4f6;
  --admyt-paper: #fffdfa;
  --admyt-mist: #f8f6ff;
  --admyt-lavender: #f0ecff;
  --admyt-indigo: #635bff;
  --admyt-violet: #8458f3;
  --admyt-plum: #2a2148;
  --admyt-teal: #21b8a5;
  --admyt-coral: #ff7a66;
  --admyt-pink: #d94f9d;
  --admyt-grad: linear-gradient(135deg, #635bff 0%, #8458f3 48%, #d94f9d 100%);
  --admyt-grad-soft: linear-gradient(135deg, #f2efff 0%, #e9fbf8 54%, #fff0eb 100%);
  --admyt-shadow: 0 18px 50px rgba(78, 65, 150, 0.11);
  --admyt-shadow-small: 0 8px 24px rgba(78, 65, 150, 0.09);
}
```

Design principles:

- Use off-white and soft lavender backgrounds instead of stark white-only surfaces.
- Keep purple/indigo as brand equity.
- Add teal as the fit/clarity signal.
- Use coral/pink sparingly for warmth and emotional energy.
- Use cards at restrained radius, around 8-12px.
- Do not create a dedicated side navigation.
- Product navigation should remain simple: Chat/Sage, Browse, Profile.

## Architecture Guardrails

Preserve the current architecture:

- Frontend: React + Vite + TypeScript.
- Hosting: Vercel.
- Database/auth/functions: Supabase.
- AI: Claude through Supabase Edge Function.

Important:

- Do not call Anthropic/Claude directly from the browser.
- Keep all Claude calls routed through `supabase/functions/chat/index.ts`.
- Keep the browser using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Never expose service role keys in frontend code.
- Do not change table names unless a migration is intentionally included.
- Preserve current RLS assumptions.

Existing Supabase tables to preserve:

- `colleges`
- `chat_messages`
- `hearted_schools`
- `saved_vibes`
- `user_preferences`
- `user_prefs` if still used for heart action count

Current backend-sensitive files:

- `src/context/AuthContext.tsx`
- `src/context/ChatContext.tsx`
- `src/context/ProfileContext.tsx`
- `src/context/CollegeContext.tsx`
- `src/lib/supabase.ts`
- `src/lib/colleges.ts`
- `src/lib/savedVibes.ts`
- `supabase/functions/chat/index.ts`

The redesign should mainly touch components, pages, styles, and shared UI pieces. Backend logic should only change if needed to support existing flows more cleanly.

## Primary Navigation Model

Keep primary app nav to:

- `/chat` - Chat with Sage
- `/search` - Browse
- `/profile` - Profile

Keep these as contextual routes only:

- `/college/:id` - reached from Browse, saved schools, school cards, or Sage recommendations
- `/college/:id/vibe` - reached from Browse cards, school detail, saved schools, or Sage chat

Do not add School Detail or Vibe Check to primary nav.

Desktop:

- Top nav with Admyt logo, Chat/Sage, Browse, Profile.
- “Back to Sage” contextual pill on non-chat pages is good and should remain.

Mobile:

- Bottom tab bar with Chat/Sage, Browse, Profile.
- School Detail and Vibe Check should not appear as bottom tabs.

## Mobile Behavior

The app must be mobile-friendly. The chat is the core experience, so mobile layout should prioritize the conversation.

On mobile:

- Chat feed appears first.
- Composer is full-width and easy to reach.
- “What Sage knows” moves below the chat, becomes collapsible, or becomes a drawer/bottom sheet.
- Recommendation school cards stack vertically.
- Browse cards stack vertically.
- School Detail sections stack vertically.
- Vibe Check dimensions stack into one column.
- Profile dashboard sections stack into one column.
- Avoid horizontal scrolling except for intentional filter chips.

Suggested mobile pattern for `What Sage knows`:

- Show a small card below the first assistant message or above the composer:
  - `Sage knows 4 things about you`
  - Tap opens drawer.
- Drawer content:
  - Location preference
  - Intended major/career goals
  - Budget sensitivity
  - Vibe preferences

Do not let the “What Sage knows” panel compete with the chat feed on small screens.

## Screens to Update

### 1. Landing Page

File:

- `src/pages/Landing.tsx`

Implement the approved landing direction:

- Hero starts with horizontal Sage animation: four floating human Sage cutout heads and Sage orb in the center.
- Use Sage orb as the main brand assistant identity.
- Keep copy rooted in `Find where you fit.`
- Include human Sage avatar scenes as supporting brand/marketing assets, not dominant product UI.
- Use teal accents introduced in the prototype.
- Keep “Start chatting with Sage” as primary CTA.

Logged-in behavior:

- `/` should redirect logged-in users to `/chat`.

Logged-out behavior:

- `/` shows landing page.
- CTA sends guest users to `/chat`.

### 2. Layout / Navigation

File:

- `src/components/layout/Layout.tsx`

Update:

- Refresh visual styling to match new tokens.
- Keep only Chat/Sage, Browse, Profile as primary nav.
- Keep contextual “Back to Sage” pill on Browse, School Detail, Vibe Check, Profile.
- Update mobile bottom nav with refreshed icons, colors, spacing.
- Use Sage orb or updated Admyt logo treatment consistently.

Avoid:

- No permanent side nav.
- No nav links for School Detail or Vibe Check.

### 3. Sage Orb / Avatar

Files:

- `src/components/sage/SageOrb.tsx`
- `src/components/sage/SageAvatar.tsx`

Update:

- Refresh Sage orb to match the approved new orb.
- Use orb wherever Sage speaks or where “Back to Sage” appears.
- If importing image assets, place them under an appropriate app asset directory such as `src/assets/sage/`.

Needed assets from prototype:

- `outputs/assets/sage-orb.png`
- `outputs/assets/sage-cutout-01.png` through `sage-cutout-08.png`
- Human/social scenes as optional marketing assets:
  - `sage-laptop-study.png`
  - `sage-headphones-chair.png`
  - `sage-park-grass-v2.png`
  - `sage-quad-backpack-v2.png`

### 4. Chat / Sage Home

File:

- `src/pages/Home.tsx`

Intent:

Chat is the core product, not a secondary assistant.

Update:

- Add a stronger empty state:
  - Sage orb
  - Warm welcome
  - Action tiles: find where I fit, check a school’s vibe, no idea where to start, compare schools
- Add “What Sage knows” summary panel on desktop.
- On mobile, move “What Sage knows” below chat or into a drawer/collapsible card.
- Make inline school recommendations feel like Sage-generated cards, not search results.
- School cards inside chat should stack cleanly on narrow screens.
- Keep persistent conversation behavior.
- Keep guest-first chat.
- Keep sign-up prompt after meaningful value moments.

Do not break:

- `useChat()`
- message persistence for signed-in users
- school card metadata rendering
- Supabase inserts to `chat_messages`
- Claude calls through the Supabase Edge Function

### 5. Inline School Card

File:

- `src/components/sage/SchoolCard.tsx`

Update:

- Use new visual system.
- Include fit score plus a short “why this might fit” explanation.
- Keep actions:
  - View school
  - Vibe Check
  - Save/heart
- Ensure cards work inside chat and Browse.

Do not break:

- `toggleHeart`
- `heartedSchools`
- navigation to `/college/:id`
- navigation to `/college/:id/vibe`

### 6. Browse / Search

File:

- `src/pages/Search.tsx`

Intent:

Browse should feel like “search with Sage beside you,” not a static database.

Update:

- Refresh search hero/header.
- Keep search and filter functionality.
- Use chips for filters.
- Add “Best fit first” feel.
- School cards should include:
  - Name/location
  - Fit score
  - quick “why this fits” read
  - tags
  - Vibe Check CTA
  - save/heart
- Include a subtle prompt to ask Sage to narrow results.

Do not break:

- `useColleges`
- `scoreCollege`
- filters by query/state/size/type/tuition/major
- navigation to detail/vibe pages

### 7. School Detail

File:

- `src/pages/CollegeDetail.tsx`

Intent:

Answer “Should I care about this school?” before dumping stats.

Update:

- Lead with school name, location, and real-talk summary.
- Add “Your fit read” card.
- Keep stats but make them scannable.
- Add sections:
  - Could fit because...
  - Watch out for...
  - Programs that might matter
  - Ask Sage prompts
- Keep Vibe Check CTA prominent.

Do not break:

- `getCollege`
- `scoreCollege`
- generated description behavior
- Supabase description update if still used
- heart/save behavior
- navigation back to Browse and Vibe Check

### 8. Vibe Check

File:

- `src/pages/VibeCheck.tsx`

Intent:

Vibe Check is a signature product moment.

Update setup state:

- Convert checkbox list into clean dimension cards.
- Make selected count clear.
- Add guidance that a focused Vibe Check can be more useful.
- Keep select all/deselect all.
- Keep disabled state when no dimensions are selected.

Update result state:

- Use darker editorial card for result summary.
- Big fit score.
- Dimension cards with bars and concise summaries.
- Actions:
  - Save Vibe Check
  - Ask Sage about this
  - Back to school

Do not break:

- selected dimension payload
- Claude JSON response parsing
- `saveVibeCheck`
- `getSavedVibe`
- auth prompt for saving
- `saved_vibes` writes

Important backend note:

- Vibe Check currently calls the Supabase Edge Function with a strict JSON system prompt. Keep this architecture.
- If the UI adds “Ask Sage about this,” send the user back to `/chat` with context or trigger an existing chat message path. Do not create a second AI backend.

### 9. Profile

File:

- `src/pages/Profile.tsx`

Intent:

Profile is Sage’s memory, not just an account page.

Update logged-in state:

- Lead with “Your Admyt profile.”
- Show:
  - What Sage knows
  - Saved schools
  - Saved Vibe Checks
  - My preferences
  - Sage nudges
- Reframe profile completeness as helpful, not bureaucratic.
- Make nudges conversational:
  - “Your budget preference is still fuzzy. That can change the whole list.”
  - “You have city schools saved. Add one campus-first school as a useful contrast.”

Update logged-out state:

- Replace current generic example profile with new brand direction.
- Make it clear what signing up unlocks:
  - saved schools
  - saved Vibe Checks
  - saved Sage conversation
  - remembered preferences
- Keep guest-first tone. Do not pressure.

Do not break:

- `hearted_schools` fetch/delete
- `saved_vibes` fetch
- `user_preferences` fetch/upsert
- preferences modal behavior

### 10. Auth Modal / Login / Signup

File:

- `src/components/ui/AuthModal.tsx`

Current auth architecture:

- Supabase Auth.
- Google OAuth.
- Email/password sign in/sign up.
- Guest-first app.

Update:

- Refresh modal styling to match new visual system.
- Use Sage orb and “Find where you fit” message.
- Keep trigger-specific copy:
  - General: save your schools, Vibe Checks, and conversation.
  - Vibe Check: save this Vibe Check and come back later.
- Preserve “Keep going without an account.”
- Keep Google OAuth.
- Keep email/password.
- Improve error styling.

Do not break:

- `signInWithGoogle`
- `signInWithEmail`
- `signUpWithEmail`
- `onSuccess`
- `onClose`
- modal usage from Home, ProfileAvatar, Profile, and VibeCheck

Possible improvement:

- Add `redirectTo: window.location.origin + '/chat'` for Google sign-in if you want post-auth to return to chat instead of root. Current root redirect already sends logged-in users to `/chat`, so this is optional.

### 11. Profile Avatar / Logged-Out Nav State

File:

- `src/components/ui/ProfileAvatar.tsx`

Update:

- Match refreshed nav styling.
- Logged-out profile click opens refreshed AuthModal.
- Signed-in state keeps dropdown/sign out behavior.
- Mobile should keep Profile tab behavior.

Do not break:

- existing auth modal trigger
- sign out behavior

### 12. Preferences Modal

File:

- `src/pages/Profile.tsx`

Current issue:

- The project context notes the preferences modal fields are hard to see.

Update:

- Redesign preferences modal with clearer labels and contrast.
- Use new token colors.
- Keep state abbreviations.
- Keep fields:
  - preferred states
  - max tuition
  - preferred majors
- Keep saving to `user_preferences`.

## Components to Create or Consolidate

Consider adding shared components so the redesign does not become duplicated inline styles.

Recommended:

- `src/components/ui/AdmytButton.tsx`
- `src/components/ui/AdmytCard.tsx`
- `src/components/ui/AdmytPill.tsx`
- `src/components/ui/FitScore.tsx` or update existing `ScoreRing.tsx`
- `src/components/sage/SageOrb.tsx` refreshed
- `src/components/sage/WhatSageKnows.tsx`
- `src/components/sage/SageSuggestionChips.tsx`
- `src/components/sage/SageNudgeCard.tsx`
- `src/components/vibe/VibeDimensionCard.tsx`
- `src/components/vibe/VibeResultCard.tsx`
- `src/components/college/CollegeCard.tsx` if `SchoolCard` becomes too chat-specific

Avoid over-abstracting before the screens are working. Shared components should remove real duplication.

## Routing Notes

Current routes are good:

```tsx
<Route path="/" element={<RootRoute />} />
<Route path="/onboarding" element={<Onboarding />} />
<Route element={<Layout />}>
  <Route path="/chat" element={<Home />} />
  <Route path="/search" element={<Search />} />
  <Route path="/college/:id" element={<CollegeDetail />} />
  <Route path="/college/:id/vibe" element={<VibeCheck />} />
  <Route path="/profile" element={<Profile />} />
</Route>
```

Keep this model.

Root behavior:

- logged out: landing page
- logged in: `/chat`

No route architecture change is required.

## Backend / AI Compatibility

The redesign does not require a backend rebuild.

Preserve:

- `ChatContext` as the state/persistence layer for chat.
- `supabase/functions/chat/index.ts` as the Claude proxy.
- `savedVibes.ts` for saved Vibe Checks.
- `colleges.ts` for college fetching.
- `matchScore.ts` for local fit scoring.

Potential issue to watch:

- `src/lib/claude.ts` appears to reference Claude helper functions and may use a model string directly. Confirm whether this file is still active. If it makes browser-side Anthropic calls, refactor it to call the Supabase Edge Function instead. The project rule is clear: all Claude calls go through Supabase Edge Function.

Potential issue to watch:

- `ChatContext` references both `user_preferences` and `user_prefs`. Do not remove either without checking current database usage. If possible, standardize in a separate migration later, not during the visual redesign.

Potential issue to watch:

- `My schools not always populating from Sage chat hearts` is noted in project context. After UI changes, run an end-to-end test:
  - save from Browse card
  - save from chat school card
  - save from School Detail
  - confirm Profile shows the school

## Logged-Out Experience

Logged-out users should still be able to:

- view landing page
- start chatting with Sage as a guest
- browse schools
- view school details
- run Vibe Check

They should be prompted to create an account at value moments:

- after enough chat messages to make saving useful
- when saving a Vibe Check
- when opening Profile
- when saving a school if persistence requires auth

Tone:

- helpful, not blocking
- “Save this so you can come back to it”
- not “Sign up to continue”

Logged-out Profile:

- Should be redesigned as a preview of what Sage can remember.
- Use the new brand system.
- CTA: `Create a free account` or `Save your fit`
- Secondary: `Keep chatting with Sage`

Login/signup modal:

- Must remain dismissible.
- Must support continuing without an account.
- Must not block core exploration too early.

## Implementation Order

1. Add/update design tokens in `src/styles/tokens.css`.
2. Refresh Sage orb component and assets.
3. Update `Layout.tsx` navigation and mobile tab bar.
4. Update `AuthModal.tsx` and logged-out `Profile` preview.
5. Update `Home.tsx` chat layout and “What Sage knows.”
6. Update `SchoolCard.tsx`.
7. Update `Search.tsx`.
8. Update `CollegeDetail.tsx`.
9. Update `VibeCheck.tsx`.
10. Update `Profile.tsx` logged-in dashboard and preferences modal.
11. Final pass on landing page assets and visual consistency.
12. Run full verification.

## Verification Checklist

Run before pushing:

- `npm install` if dependencies changed.
- `npm run build`
- `npm run lint` if available.
- Local dev server smoke test.

Manual flows:

- Logged-out `/` shows landing.
- Logged-in `/` redirects to `/chat`.
- Guest can open `/chat`.
- Guest can browse schools.
- Guest can open a school detail page.
- Guest can run Vibe Check.
- Guest is prompted to sign up when saving.
- Email signup works.
- Email sign-in works.
- Google OAuth still works.
- Chat sends messages and receives Claude responses.
- Chat messages persist for signed-in user.
- School recommendation cards render in chat.
- Browse filters still work.
- School Detail loads real college data.
- Vibe Check returns valid JSON and renders results.
- Saved Vibe Check appears in Profile.
- Hearted/saved school appears in Profile.
- Preferences save to Supabase.
- Mobile: no horizontal overflow at 390px.
- Mobile: Chat, Browse, Profile are the only bottom nav items.
- Mobile: School Detail and Vibe Check are reachable contextually.
- Vercel production build succeeds.

## Vercel Notes

No special Vercel architecture change is needed.

Confirm production env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Confirm Supabase Edge Function secrets:

- Anthropic API key stays in Supabase function secrets, not Vercel frontend env.

If deploying updated static assets:

- Keep asset sizes reasonable.
- Compress PNGs where possible.
- Use Vite asset imports or `public/` intentionally.

## What Could Break and How to Avoid It

### Risk: Claude calls break

Cause:

- Moving AI calls into new UI components directly.

Avoid:

- Keep all AI calls in existing chat/Vibe Check pathways.
- Use Supabase Edge Function only.

### Risk: saved schools stop appearing

Cause:

- Changing `toggleHeart` or card save behavior.

Avoid:

- Preserve `useChatContext`, `heartedSchools`, and `toggleHeart`.
- Test Profile after saving from multiple entry points.

### Risk: Vibe Check save fails

Cause:

- Changing result shape or selected dimension keys.

Avoid:

- Keep existing `VibeResult` and `VibeDimension` structure unless updating parser and saved table together.

### Risk: logged-out flow becomes too restrictive

Cause:

- Putting auth gates before exploration.

Avoid:

- Keep guest-first access.
- Prompt at save/value moments only.

### Risk: mobile chat becomes cramped

Cause:

- Keeping desktop “What Sage knows” side panel on mobile.

Avoid:

- Collapse it below chat or into a drawer.
- Keep chat feed and composer primary.

### Risk: route confusion

Cause:

- Treating School Detail and Vibe Check as primary nav pages.

Avoid:

- Keep them contextual routes only.

## Copy Principles

Use Sage voice everywhere:

- warm
- direct
- concise
- honest
- student-first

Good examples:

- “That is a real preference, not a contradiction.”
- “Want me to find a few schools like that?”
- “This could work, with one real caveat.”
- “Save this so you can come back to it.”

Avoid:

- “Optimize your college search journey.”
- “Submit preferences.”
- “Unlock premium insights.”
- “Best-in-class recommendations.”
- brochure language
- pressure language

## Final Product Intent

After implementation, Admyt should feel like one coherent guided experience:

- Landing explains the promise.
- Chat starts the relationship.
- Browse gives options with context.
- School Detail explains tradeoffs.
- Vibe Check delivers the honest read.
- Profile becomes Sage’s memory.
- Auth protects persistence without blocking exploration.

The product should make a student feel:

“I do not have to know exactly what I want yet. Sage can help me figure it out.”
