# Admyt — Landing Page Copy & Structure

*The marketing front door. Shown to logged-out visitors and shared on socials/search. Logged-in users skip this entirely and go straight to Sage.*

**Voice reminder:** Playful, warm, bold. Sentence case. "You" constantly. Would it make a stressed-out 17-year-old feel understood? Then it's right.

**Primary CTA throughout:** Start chatting with Sage
**Secondary CTA:** See how it works *(quiet link now; points to a guided flow/video later)*

---

## Section 1 — Hero (lead with the promise)

**Eyebrow:** the y is for you

**Headline:**
# Find where you fit.

**Subhead:**
College isn't about the rankings. It's about finding the place where you'll actually thrive. Admyt helps you discover schools that match who you are — not just your GPA.

**Primary button:** Start chatting with Sage
**Secondary link:** See how it works →

*Visual: the Sage gradient orb, alive. Maybe a hint of the chat interface peeking in below the fold so people see it's a conversation, not a form.*

---

## Section 2 — The problem (name the enemy)

**Section headline:**
## The college search is broken.

**Body:**
Somewhere along the way, finding a college stopped being exciting and started being terrifying.

It became a numbers game. A GPA. A test score. A ranking in a magazine. A list of "reach, target, safety" schools from a counselor with four hundred other students. A dinner-table debate about which name will look best.

And underneath all of it, the one question almost nobody asks you:

**Where would you actually be happy?**

*Visual: maybe a stylized "before" — a cluttered, anxious collage of rankings, test scores, pressure — that gives way to calm as you scroll.*

---

## Section 3 — Meet Sage (introduce the friend)

**Eyebrow:** meet sage

**Headline:**
## Like having a friend who already figured it out.

**Body:**
Sage is the senior who's been through the whole confusing process, learned from it, and genuinely wants you to get it right. The older sibling you wish you had.

You can ask Sage the real questions — the ones that feel too small or too honest to ask anyone else:

- *Will I be lonely there?*
- *Do people like me actually go here?*
- *Is everyone going to be richer than me?*
- *What's it really like?*

Sage doesn't push. Sage doesn't hype the famous schools. Sage helps you understand yourself first — then helps you find the places that match.

**Button:** Chat with Sage

*Visual: a real (or realistic) snippet of a Sage conversation — warm, honest, with a school card surfacing inline.*

---

## Section 4 — How it works (the guided explainer)

**Section headline:**
## How Admyt works

**Step 1 — Just start talking.**
No forms, no logins, no SAT score required. Tell Sage what you're thinking — or that you have no idea where to start. Both are totally fine.

**Step 2 — Sage gets to know you.**
Through a real conversation, Sage learns what actually matters to you — your goals, your budget, the kind of place you'd feel at home. Not just your stats.

**Step 3 — Discover schools that fit.**
Sage surfaces colleges matched to *you* — including ones you've never heard of that might fit better (and cost less) than the names everyone talks about.

**Step 4 — Run a Vibe Check.**
Before you fall in love with a school, see what it's really like. Vibe Check breaks down the social scene, culture, and campus life — honestly — so you know if you'd actually thrive there.

**Button:** Start chatting with Sage

---

## Section 5 — Vibe Check spotlight (the signature feature)

**Eyebrow:** ✨ vibe check

**Headline:**
## Would you actually vibe there?

**Body:**
A school can look perfect on paper and feel completely wrong in person. Vibe Check is how you find out before you apply.

Pick what matters to you — social scene, creativity, diversity, the outdoors, school spirit, whatever — and Sage gives you the real read on campus culture. Not the brochure version. The honest one.

Because fit isn't a number. It's a feeling. And you deserve to know it before you commit four years of your life.

*Visual: the gradient Vibe Check hero + a couple of dimension score cards.*

---

## Section 6 — What we believe (the values that build trust)

**Section headline:**
## What we stand for

**Fit beats rank.**
The right school is the one where you'll thrive — not the one that scores highest on someone else's list.

**Everyone deserves a guide.**
Great college guidance shouldn't cost thousands or depend on which counselor you got. Admyt is free, for anyone, from the first question.

**There are more options than you've been told.**
We'll introduce you to schools you've never heard of — including ones that fit you better and cost a lot less.

**We're on your side. Only yours.**
We'll never sell your data. We'll never take money to promote schools. Every recommendation is about your fit — nothing else.

---

## Section 7 — Who it's for (so people see themselves)

**Section headline:**
## Built for you — especially if no one's helped before.

**Body:**
Maybe you're the first in your family to do this, with no roadmap and no one to ask. Maybe you're drowning in everyone else's expectations and just want someone to ask what *you* want. Maybe you test fine but don't see yourself in the glossy brochures. Maybe you just need a school you can actually afford.

Whoever you are — Admyt is a place to begin.

---

## Section 8 — Final CTA (the close)

**Headline:**
## Your future starts with a conversation.

**Subhead:**
No forms. No pressure. No cost. Just an honest conversation about where you actually belong.

**Primary button:** Start chatting with Sage
**Microcopy under button:** Free forever · No account needed to start

---

## Footer

**Wordmark:** adm**y**t — with the gradient y

**Tagline:** Find where you fit.

**Links (build as the product grows):**
- About
- How it works
- Privacy (lead with: we never sell your data)
- Contact

**The y is for you.**

---

## Routing logic (for the build)

- **Logged-out visitor** hits `/` → sees this landing page
- **Logged-in user** hits `/` → redirect straight to the Sage chat experience, skip the landing page entirely
- "Start chatting with Sage" → drops them into the chat (as a guest; they can create an account later when prompted after a Vibe Check)
- "See how it works" → for now, a quiet secondary link (can anchor-scroll to the How It Works section); later, point at a guided flow or short video

---

## Notes on tone for whoever builds/designs this

- This is the one place Admyt can be a little more expansive and emotional than the in-app voice — it's the story, told fully, for someone meeting Admyt for the first time.
- Keep the gradient design system: white background, cool indigo/purple core, pink/coral accents at the vibe and heart moments, the living Sage orb.
- Big, friendly type. Generous whitespace. Let it breathe — the opposite of the cluttered, anxious thing we're positioning against.
- Every section should feel like it's on the student's side. If any line feels like a brochure or a sales pitch, rewrite it in Sage's voice.
