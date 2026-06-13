# Admyt — Landing Page Build

Build a full marketing landing page for Admyt. Read `admyt-landing-page-copy.md` for all copy — use it verbatim, do not paraphrase or invent copy. Read `admyt-brand-story.md` and `sage-personality-guide.md` for voice reference. When done run `git add . && git commit -m "feat: marketing landing page with logged-in/out routing" && git push`

---

## Overview

The landing page is the marketing front door — shown to logged-out visitors, shareable on social, findable in search. Logged-in users skip it entirely and go straight to the Sage chat. Build it as `src/pages/Landing.tsx` and wire up the routing split in `src/App.tsx`.

---

## Routing — update `src/App.tsx`

The root route `/` must split based on auth state:
- **Logged-out** → render `<Landing />`
- **Logged-in** → redirect to `/chat` (or keep `/` as the chat if that's the current structure — just make sure logged-in users never see the landing page)

Use `useAuth()` to get the user. Show a brief loading state (the Sage orb centered, no text) while auth resolves so there's no flash of the wrong page.

```tsx
import Landing from '@/pages/Landing'

// In the root route:
<Route path="/" element={<RootRoute />} />

// RootRoute component:
function RootRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingOrb />
  if (user) return <Navigate to="/chat" replace />
  return <Landing />
}
```

If the current home page (Sage chat) is at `/`, move it to `/chat` and update all internal links, the bottom tab bar, and the "Back to Sage" pill to use `/chat` instead of `/`. The landing page then cleanly owns `/`.

---

## Design system (carry through from existing tokens)

Pull from `src/styles/tokens.css`. All the same rules apply:
- Background: `#FCFCFF`
- Gradient core: `linear-gradient(135deg, #6366F1, #8B5CF6)`
- Vibe accent: `#EC4899` / `#F9A8D4`
- Card border: `#EEECFB`
- Body text: `#3A3A4D`, muted: `#8B8B9E`, faint: `#A8A8BC`
- Radius: 18-22px on hero blocks, 14-16px on cards
- Shadows: `0 3px 16px rgba(99,102,241,0.06)`
- Font: Inter (already loaded)

Max content width: `720px`, centered, `padding: 0 20px`. Full-bleed gradient sections can break out of the content width.

---

## Scroll animation system

Use a simple CSS + IntersectionObserver approach — no libraries needed.

Add this to `src/styles/tokens.css` (or a new `src/styles/animations.css` imported in `main.tsx`):

```css
.fade-up {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}

.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.fade-up-delay-1 { transition-delay: 0.1s; }
.fade-up-delay-2 { transition-delay: 0.2s; }
.fade-up-delay-3 { transition-delay: 0.3s; }
.fade-up-delay-4 { transition-delay: 0.4s; }
```

Create a reusable hook `src/hooks/useFadeUp.ts`:

```ts
import { useEffect, useRef } from 'react'

export function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
```

Apply `className="fade-up"` + the ref to each section and key elements within sections. Stagger child elements using the delay classes.

---

## Landing page sections — `src/pages/Landing.tsx`

Build each section in order. Use the exact copy from `admyt-landing-page-copy.md`.

### Nav
Sticky top nav, white bg, `border-bottom: 1px solid #F0EEFB`, `padding: 14px 20px`.
- Left: Admyt wordmark — "adm" in `#15151C` + "yt" in gradient text (`linear-gradient(135deg,#6366F1,#8B5CF6)` clipped)
- Right: "Start chatting with Sage" button — gradient bg, white text, `border-radius: 20px`, `padding: 8px 18px`, `font-size: 13px`
- Mobile: hide the button on screens under 480px, just show the wordmark

### Section 1 — Hero

Full-bleed section, `padding: 80px 20px 60px`, centered.

**Eyebrow:** "the y is for you" — 11px, uppercase, letter-spacing 0.08em, gradient text, margin-bottom 16px. Fade up on load (no scroll trigger needed — it's above the fold, just animate in on mount with a short delay).

**Sage orb:** The same orb from `SageOrb.tsx` at size 80px. Center it above the headline. Add a soft glow behind it: `box-shadow: 0 0 60px rgba(99,102,241,0.25)`. On mount, animate it scaling from 0.8 to 1.0 with `transition: transform 0.6s ease` — gives it a "breathing in" feeling as the page loads.

**Headline:** "Find where you fit." — 48px on desktop, 36px on mobile, weight 500, `#15151C`, letter-spacing -0.8px. The word "fit" gets gradient text.

**Subhead:** From the copy doc — 17px, `#8B8B9E`, line-height 1.65, max-width 520px, centered.

**CTA row:** Primary button "Start chatting with Sage" (gradient bg, white, `border-radius: 24px`, `padding: 14px 28px`, 15px font, `box-shadow: 0 6px 20px rgba(99,102,241,0.25)`). Secondary link "See how it works →" (13px, `#8B8B9E`, no underline, anchor-scrolls to `#how-it-works` section).

**Chat preview:** Below the CTAs, a subtle mockup of the Sage chat interface — just enough to show it's a conversation. A rounded card (`border-radius: 22px`, `border: 1px solid #EEECFB`, `box-shadow: 0 8px 40px rgba(99,102,241,0.08)`) containing:
- One Sage message bubble: "Hey, I'm Sage 👋 Tell me what you're looking for in a college — or just that you have no idea. Both are totally fine."
- One user bubble: "Honestly? I have no idea where to start."
- One more Sage bubble: "Perfect starting point. Let's figure it out together."
- The input bar at the bottom (non-functional, just visual)
Fade this up on scroll.

---

### Section 2 — The problem

`padding: 80px 20px`, centered, max-width 640px.

Fade up the headline, then fade up the body with a slight delay.

Headline: "The college search is broken." — 34px, weight 500, `#15151C`

Body: three paragraphs from the copy doc. The final bold line "Where would you actually be happy?" gets gradient text and slightly larger size (18px).

---

### Section 3 — Meet Sage

`padding: 80px 20px`, light lavender background `#F8F7FF` (full bleed), centered content max-width 680px.

Eyebrow: "meet sage" — same style as hero eyebrow.

Headline: "Like having a friend who already figured it out." — 34px, weight 500.

Body paragraph, then the four italic questions in a styled list — each question in its own pill: `background: #fff`, `border: 1px solid #EEECFB`, `border-radius: 14px`, `padding: 12px 16px`, italic, `#3A3A4D`. Fade each pill up with staggered delays (0.1s apart).

The four questions from the copy doc, styled as pills stacked vertically or in a 2-col grid on desktop.

Button "Chat with Sage" — gradient bg, white, same style as hero CTA but slightly smaller (`padding: 12px 24px`). Links to `/chat` for guests (they'll see the Sage chat as a guest).

---

### Section 4 — How it works

`id="how-it-works"` so the "See how it works →" anchor link works.

`padding: 80px 20px`, centered, max-width 680px.

Headline: "How Admyt works" — 34px, weight 500.

Four steps in a vertical timeline layout. Each step:
- A gradient numbered circle on the left (36px, gradient bg, white number, weight 500)
- Step title in 15px weight 500 `#15151C`
- Step body in 13px `#8B8B9E`
- A thin gradient left-edge connector between steps (except after the last one)

Fade each step up with staggered delays.

Button "Start chatting with Sage" centered below the steps.

---

### Section 5 — Vibe Check spotlight

Full-bleed gradient section: `background: linear-gradient(150deg, #6366F1, #8B5CF6 60%, #EC4899)`, `padding: 80px 20px`.

Everything inside is white text.

Eyebrow: "✨ vibe check" — white, 11px, uppercase, letter-spacing 0.08em, opacity 0.85.

Headline: "Would you actually vibe there?" — 34px, weight 500, white.

Body from the copy doc — white, opacity 0.9.

Below the body, a mini Vibe Check mockup — 2-3 dimension score cards in white with gradient score bars, inside a rounded card. Use these as examples:
- Social scene 7/10 — gradient bar
- Arts & creativity 8/10 — gradient bar
- Outdoor access 6/10 — gradient bar

Each card: white bg, `border-radius: 14px`, `padding: 12px 14px`, dimension name + score in indigo, gradient progress bar. Cards in a 2-col grid or stacked on mobile.

Fade up the mockup cards with staggered delays.

---

### Section 6 — What we stand for

`padding: 80px 20px`, centered, max-width 680px.

Headline: "What we stand for" — 34px, weight 500.

Four value cards in a 2-col grid (1-col on mobile). Each card:
- White bg, `border: 1px solid #EEECFB`, `border-radius: 18px`, `padding: 20px`
- A gradient icon accent at top (a small 36px circle with a relevant emoji: 🎯 🤝 🗺️ 🛡️)
- Value title in 14px weight 500 `#15151C`
- Value body in 13px `#8B8B9E`
- Subtle gradient top edge (3px, same as school cards)

Fade each card up with staggered delays.

Value content exactly from the copy doc:
1. Fit beats rank. 🎯
2. Everyone deserves a guide. 🤝
3. There are more options than you've been told. 🗺️
4. We're on your side. Only yours. 🛡️

---

### Section 7 — Who it's for

`padding: 80px 20px`, background `#F8F7FF` (full bleed), centered, max-width 600px.

Headline: "Built for you — especially if no one's helped before." — 34px, weight 500.

Body from the copy doc. The final line "Whoever you are — Admyt is a place to begin." in gradient text, slightly larger (16px).

Fade up the body with a slight delay after the headline.

---

### Section 8 — Final CTA

`padding: 100px 20px`, centered, max-width 560px.

Headline: "Your future starts with a conversation." — 38px, weight 500, `#15151C`, letter-spacing -0.5px.

Subhead from copy doc — 16px, `#8B8B9E`.

Primary button "Start chatting with Sage" — same hero style, full width on mobile, auto on desktop.

Microcopy "Free forever · No account needed to start" — 12px, `#A8A8BC`, centered, margin-top 10px.

Fade everything up on scroll.

---

### Footer

White bg, `border-top: 1px solid #F0EEFB`, `padding: 32px 20px`.

Left: Admyt wordmark + "Find where you fit." in 12px `#A8A8BC` below it.

Right: Links — About, Privacy, Contact — 13px `#A8A8BC`, no underline. These can be placeholder `href="#"` for now.

Bottom center: "The y is for you." — 11px, gradient text, centered.

---

## Buttons and links behavior

- All "Start chatting with Sage" / "Chat with Sage" buttons → `navigate('/chat')` using react-router `useNavigate`. Guest users land on the chat page and can use Sage without signing in.
- "See how it works →" → `document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })`
- Nav CTA → same as main CTAs, `/chat`

---

## Mobile responsiveness

- Hero headline: 48px → 32px on mobile
- Section headlines: 34px → 26px on mobile
- Two-col grids → single col on mobile (under 640px)
- Nav button hidden under 480px
- Chat preview mockup: hide on screens under 480px to keep the hero clean
- Generous padding maintained throughout — never feels cramped

---

## What NOT to do

- Do not change any existing pages, components, routing, or Supabase logic outside of what's specified here
- Do not invent copy — use `admyt-landing-page-copy.md` verbatim
- Do not add heavy animation libraries (framer-motion, gsap) — CSS + IntersectionObserver only
- Do not make the chat preview functional — it's purely visual
- Do not show the bottom tab bar on the landing page — it's an app nav, not a marketing nav
