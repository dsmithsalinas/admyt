# Admyt product continuity audit

Date: July 30, 2026

## Overall verdict

The core product is functionally clear, but its visual language now spans two generations. Sage chat establishes the new premium spatial system. Browse and reusable school cards still feel like the prior card-and-filter system, while Vibe Check and School Detail sit partway between the two. The right move is a continuity pass, not a cinematic rebuild of every utility screen.

## 1. Browse

Screenshot: `/tmp/admyt-continuity-01-browse.png`

Health: Functionally strong; visually one generation behind.

- The search, filters, result count, and card grid are immediately understandable.
- The pale container, equally weighted filter pills, and repeated white cards make the screen feel flatter and more generic than the landing and Sage chat.
- Sage is present as copy and a button, but not as the visual center of gravity.
- The very light “Chat with Sage to get your score” treatment may be difficult to read. Keyboard focus and measured contrast still need direct testing.

## 2. School detail

Screenshot: `/tmp/admyt-continuity-02-school-detail.png`

Health: Good bridge; only partial continuity.

- The dark gradient hero and large school title already belong to the newer Admyt world.
- The fit read is prominent and the primary actions are easy to find.
- Below the hero, the interface returns to conventional white utility cards. That is acceptable for dense information, but the material, spacing, and Sage presence could be more consistent.
- Screenshot review cannot confirm focus order, responsive overflow, or interactive-state accessibility.

## 3. Vibe Check

Screenshot: `/tmp/admyt-continuity-03-vibe-check.png`

Health: Strong workflow; under-expressed signature experience.

- The setup is clear, selected states are visible, and the persistent action panel makes the next step obvious.
- The gradient introduction starts to match the new brand, but the rest reads as a standard settings form.
- Because Vibe Check is Admyt’s thesis, it should feel more distinctive than Browse: canonical Sage presence, more depth, and a memorable score reveal.
- Emoji provide quick recognition, but their rendering varies by platform. Selection must continue to use text, borders, and checkmarks rather than color or emoji alone.

## 4. Sage chat

Screenshot: `/tmp/admyt-continuity-04-chat.png`

Health: Strong new reference.

- The canonical Sage orb, dark spatial field, floating conversation surface, and warm paper lighting create the premium system the other screens should inherit.
- This should remain the reference for identity and depth, while utility screens use a calmer, more practical version of it.

## Recommended modernization order

1. **Create one premium school-card system.** Reuse it in Browse and Sage chat so match score, fit explanation, school facts, save, details, and Vibe Check actions no longer drift between implementations.
2. **Modernize Browse around that card.** Keep the dense search and filters, but use a quieter spatial background, a floating filter dock, stronger result hierarchy, and a subtle Sage guide presence.
3. **Make Vibe Check the signature product moment.** Preserve the existing setup, streaming, receipts, persistence, and comparison behavior; redesign the surface and score reveal around the canonical Sage orb and premium depth.
4. **Polish School Detail last.** Its hero already bridges the two systems. Carry the newer materials and spacing into the lower information modules after the shared card and Vibe Check are established.

## Scope recommendation

Do not give every screen the full animated landing treatment. The product rule should be “same house, different room”:

- Landing: cinematic invitation.
- Sage chat: immersive conversation.
- Vibe Check: signature guided analysis.
- Browse and School Detail: premium, calm work surfaces.
- School cards: the shared connective tissue across all of them.

## Implementation status

Completed in the local continuity build:

- One shared premium school-card component now serves Browse and Sage chat.
- Browse now uses the calmer premium spatial work-surface treatment.
- Vibe Check now carries the canonical Sage identity through setup, streaming, completed results, and the chat handoff.
- School Detail’s hero and lower modules now use one consistent premium material system.
- Desktop and mobile interaction checks passed; the full evidence is recorded in `design-qa.md`.
