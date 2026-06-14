# Admyt landing page redesign implementation brief

Date: 2026-06-13

This brief captures the current approved landing-page direction so it can be implemented later in the real Admyt app by Codex, Claude Code, or another coding agent.

## Source references

Use these project docs as the source of truth:

- `/Users/dustinsmith-salinas/Projects/admyt/admyt-brand-story.md`
- `/Users/dustinsmith-salinas/Projects/admyt/admyt-landing-page-copy.md`
- `/Users/dustinsmith-salinas/Projects/admyt/sage-personality-guide.md`
- `/Users/dustinsmith-salinas/Projects/admyt/admyt-naming-conventions.md`
- `/Users/dustinsmith-salinas/Projects/admyt/docs/BRAND.md`

Important hierarchy:

- The newer brand story wins on tagline and brand meaning.
- Use `Find where you fit.` as the primary hero tagline.
- Use `the y is for you` as the hero eyebrow / brand signature.
- Keep `fit` as the umbrella brand promise.
- Keep `Vibe Check` as the signature feature name.
- Use the older brand doc mainly for color discipline: indigo, lavender, vibe pink, off-white.
- Keep the new teal accent as a trust / fit signal.

## Current mockup files

Local preview:

- Landing page mockup: `outputs/admyt-redesign-mockup.html`
- Standalone hero animation: `outputs/sage-hero-animation-mockup.html`

If preview server is running:

- `http://127.0.0.1:4173/admyt-redesign-mockup.html`
- `http://127.0.0.1:4173/sage-hero-animation-mockup.html`

## Asset inventory

Copy these assets into the real app when implementing. Suggested destination:

`/Users/dustinsmith-salinas/Projects/admyt/public/brand/sage/`

Core Sage orb:

- `outputs/assets/sage-orb.png`

Transparent human Sage cutouts:

- `outputs/assets/sage-cutout-01.png`
- `outputs/assets/sage-cutout-02.png`
- `outputs/assets/sage-cutout-03.png`
- `outputs/assets/sage-cutout-04.png`
- `outputs/assets/sage-cutout-05.png`
- `outputs/assets/sage-cutout-06.png`
- `outputs/assets/sage-cutout-07.png`
- `outputs/assets/sage-cutout-08.png`

Keyed source files, kept only if edge cleanup is needed:

- `outputs/assets/sage-cutout-01-key.png` through `outputs/assets/sage-cutout-08-key.png`

Human Sage portrait/social assets:

- `outputs/assets/human-sage-01.png` through `outputs/assets/human-sage-08.png`

Scene/social assets, not currently used heavily on landing page:

- `outputs/assets/sage-laptop-study.png`
- `outputs/assets/sage-headphones-chair.png`
- `outputs/assets/sage-park-grass-v2.png`
- `outputs/assets/sage-quad-backpack-v2.png`

## Sage identity rules

Sage should work as a system, not a single mascot.

Core rule:

- In product, Sage is the orb.
- In marketing, human Sage avatars can appear as expressions of Sage's warmth.
- Do not make a single human face the default Sage identity.

Use the orb for:

- Chat avatar
- Nav mark
- Loading states
- Footer / small brand moments
- Any in-app Sage representation

Use human Sage avatars for:

- Landing page visual warmth
- Social graphics
- Marketing campaigns
- Storytelling moments
- Optional supporting visuals in onboarding

Do not use human avatars as:

- The primary in-chat avatar
- The app icon
- A fixed canonical identity for Sage

## Landing page structure

Implement this structure in the real app, likely in `src/pages/Landing.tsx`.

### Nav

- Sticky top nav.
- Left: `admyt` wordmark with Sage orb mark.
- Right: links plus `Start chatting with Sage`.
- Hide nonessential nav links on narrow screens.

### Hero

The first visual element should be the horizontal Sage animation:

- Four transparent human Sage cutout heads in a horizontal line.
- Sage orb centered between them.
- Orb bounces gently.
- Pulse rings radiate from the orb.
- Human cutouts float subtly.
- No heavy background, no square avatar cards.
- Keep it compact enough that the hero copy appears in the first viewport.

Hero copy:

- Eyebrow: `the y is for you`
- H1: `Find where you fit.`
- Body: `College isn't about the rankings. It's about finding the place where you'll actually thrive. Admyt helps you discover schools that match who you are — not just your GPA.`
- Primary CTA: `Start chatting with Sage`
- Secondary CTA: `See a sample match`

Trust promises directly in hero:

- `No account needed`
- `No sponsored results`
- `Your data stays yours`

### Product proof card

Keep a real-looking Sage chat preview in the hero.

Use Sage voice:

- "Hey, I'm Sage 👋 Tell me what's in your head right now — schools, money, pressure, no idea where to start. All fair game."
- User message: "I want a smaller school, not too preppy, with good aid and outdoorsy people."
- Sage: "Say less. That gives us a real pattern. Can I throw a curveball?"

Sample match:

- `Lewis & Clark College`
- `91% fit`
- Reasons should be plain and honest:
  - Outdoors are part of the rhythm there, not just brochure scenery.
  - Small classes could make it easier to find your people early.
  - Less status-chasing, more independent and creative energy.
  - Real talk: compare aid before you let any school become the dream.

### Meet Sage

Use this section to explain the identity system lightly.

Copy direction:

- H2: `One guide. A lot of ways to feel seen.`
- Body: `Sage is the calm voice in your corner — part older sibling, part friend who already figured it out. However you picture that person, the point is the same: you're not doing this alone.`
- Note: `In chat, Sage stays simple: a calm little orb, ready when you are.`

Use small human portrait/cutout accents lightly. Avoid a heavy gallery block.

### How Admyt works

Use four steps:

1. `Just start talking`
2. `Sage gets to know you`
3. `Discover schools that fit`
4. `Run Vibe Check`

Keep copy warm, direct, and non-brochure.

### Vibe Check

Keep this as the signature feature section.

Copy direction:

- Eyebrow: `Vibe Check`
- H2: `Would you actually vibe there?`
- Body should explain that Vibe Check shows culture, social scene, and daily life before a student commits.
- Include a score card or mock report.
- Include one small human Sage avatar/cutout as an accent, not a large scene.

Sample Vibe Check:

- School: `Oberlin College`
- Headline: `Creative, activist, and proudly unusual.`
- Dimensions:
  - `Creative energy` 9/10
  - `Traditional school spirit` 4/10
  - `Finding your people` 8/10
- Readout should start with `Real talk:`

### What we stand for

Values:

- `Fit beats rank`
- `Everyone deserves a guide`
- `Affordability is part of fit`
- `Only on your side`

Include explicit trust promises:

- Never sell student data.
- Never take money to promote schools.
- No sponsored results.
- Recommendations are about fit.

### Who it's for

Use the current brand story direction:

- First-gen students.
- Overwhelmed juniors.
- Students under pressure from expectations.
- Students who need affordability to be part of the conversation.

Headline:

- `Built for you — especially if no one's helped before.`

### Final CTA

Use:

- H2: `Your future starts with a conversation.`
- Body: `No forms. No pressure. No cost. Just an honest conversation about where you actually belong.`
- CTA: `Start chatting with Sage`
- Microcopy: `Free forever · No account needed to start`

## Horizontal Sage hero animation details

Current standalone reference:

`outputs/sage-hero-animation-mockup.html`

Visual requirements:

- Horizontal line, not vertical orbit.
- Four transparent head cutouts around center orb.
- The cutouts should be PNG-style heads only, no square background.
- Center orb stays canonical Sage.
- The graphic should feel airy and not take over the hero.
- It should appear before hero text.

Motion:

- Orb: gentle vertical bob, approximately 3 seconds.
- Pulse: 2-3 rings expanding from the orb, low opacity.
- Cutouts: subtle float, slow and staggered.
- Respect `prefers-reduced-motion`.

Suggested CSS animation names:

- `bob`
- `pulse`
- `float`

Implementation notes:

- The generated `sage-orb.png` has extra padding, so use CSS scale inside clipped circular containers.
- Existing mockup uses `transform: scale(1.72)` on orb images.
- Keep overflow clipped where orb is displayed inside small circles.

## Visual design notes

Current palette:

- Ink: `#17161f`
- Muted: `#696778`
- Line: `#e8e5f4` or `#eeecfb`
- Off-white: `#fcfcff`
- Lavender section: `#f8f7ff`
- Indigo: `#6366f1`
- Violet: `#6957e8`
- Purple: `#8b5cf6`
- Vibe pink: `#f0abfc`
- Coral: `#e9776a`
- Teal: `#1b9a9c`

Style:

- Calm, airy, emotionally intelligent.
- Rounded cards are okay, but avoid making the page feel card-heavy.
- Keep the UI generous, but do not bury product proof below too much whitespace.
- Use teal as a small trust/fit accent, not the dominant palette.
- Avoid a one-note purple page.

## Voice rules

Follow Sage voice:

- Warm.
- Honest.
- Playful.
- Calm.
- Curious about the student.
- Short, real, conversational.
- Sentence case.
- "You" and "your" often.
- No admissions jargon.
- No fake urgency.
- Emoji sparingly.

Avoid:

- Brochure language.
- "Best school" framing.
- Prestige-first language.
- Corporate AI assistant tone.
- Overexplaining the product like SaaS marketing.

Use lines like:

- `Say less.`
- `Real talk —`
- `No rush.`
- `We'll figure it out together.`
- `Can I throw a curveball?`

## Implementation checklist for the real app

1. Copy finalized assets into the app, preferably under `public/brand/sage/`.
2. Create or update `Landing.tsx`.
3. Add `SageHeroAnimation` component for the horizontal cutout/orb animation.
4. Use `sage-orb.png` anywhere the placeholder CSS orb currently appears.
5. Use `sage-cutout-01.png` through `sage-cutout-04.png` in the hero animation.
6. Keep `sage-cutout-05.png` through `sage-cutout-08.png` available for future marketing/social variations.
7. Keep human portrait assets available for social/marketing, but do not make them the default in-product Sage identity.
8. Add responsive styles for mobile:
   - Hero animation remains horizontal.
   - Cutouts shrink, not wrap.
   - Hero copy stays readable in first viewport.
9. Add `prefers-reduced-motion` support.
10. Verify desktop and mobile with browser screenshots.
11. Only after the full brand refresh is approved, commit and push.

## Do not do yet

- Do not push to `youradmyt.vercel.app` yet.
- Do not commit changes to the real app yet.
- Do not replace other app screens until screenshots are reviewed.
- Do not make one human avatar the canonical Sage identity.

## Next likely step

After the landing page direction is approved, review screenshots of the other app pages and extend this same system across:

- Chat
- School match results
- Vibe Check
- My Schools
- What Sage knows
- Auth / guest prompts
- Empty states
- Loading and error states
