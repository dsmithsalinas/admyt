# Admyt — Copy & Voice Pass

Do a full copy and voice pass across the Admyt app so every piece of user-facing text matches Sage's voice and the Admyt brand. Also update Sage's system prompt so the AI itself talks in this voice.

## Reference docs (read these first — they define the voice)

These markdown files are in the repo. Read all three before changing anything:

- `sage-personality-guide.md` — Sage's voice, traits, rules, and example responses. THIS is the primary reference for how everything should sound.
- `admyt-brand-story.md` — the brand story, values, and tagline system. Note the finalized taglines: primary is "Find where you fit." (not "Find your fit.")
- `admyt-naming-conventions.md` — what features are named what. Respect these names exactly.

## Voice rules (the short version — full detail in the guide)

- Sentence case everywhere. Not Title Case. We're a friend, not a headline.
- "You" and "your" constantly. It's about the student.
- Short, real, warm. No jargon, no admissions-speak, no corporate tone.
- Playful, warm, bold. Emoji occasionally and tastefully (👋 ✨ 👇), not everywhere.
- Encouraging without being fake. Honest about tradeoffs.
- The test: would this make a stressed-out 17-year-old feel like they finally found something that gets them? If it sounds like a brochure, rewrite it.

## Scope — what to update

This is a COPY and VOICE pass. Do NOT change functionality, logic, data flow, routing, or styling. Only change user-facing text strings and the Sage system prompt.

Go through every page and component and update:

1. **Buttons & CTAs** — make them active and warm. Examples of the direction (use judgment, follow the voice guide):
   - Generic "Submit" / "Get Started" → "Start chatting with Sage" / "Find my fit"
   - "Get personalized matches" → something with more Sage energy
   - "Run Analysis" → keep "Run my Vibe Check" energy
   - "Save" → fine as-is, or "Save to my list" where it adds clarity

2. **Empty states** — these are high-value voice moments. Every empty state should sound like Sage, not a system message.
   - "No saved schools yet" → warm Sage-voiced version (e.g. "No saved schools yet — heart the ones you love and they'll show up here.")
   - Apply to: empty My Schools, empty Vibe Checks, empty What Sage knows, empty preferences, empty search results

3. **Headings & section titles** — sentence case, warm where appropriate. Match the brand. "Find where you fit." is the primary tagline if a hero line is needed.

4. **Onboarding / first-run copy** — should feel like meeting Sage. See the "First hello" and "Student has no idea where to start" examples in the personality guide.

5. **Profile page copy** — section headers, the completeness nudges, the guest preview CTA. "What Sage knows" stays (it's a defined name). Completeness nudges should sound like Sage encouraging, not a progress meter scolding.

6. **Vibe Check copy** — intro text, the dimension selector instructions, the save prompt, the guest prompt. Lead with personality. See the "Vibe Check intro" and "Vibe Check result" examples in the guide.

7. **Auth modal copy** — the sign-up prompt headline and subtext. Warm, low-pressure, "free, no account needed to start" energy. Never pushy.

8. **Microcopy & system messages** — loading states, error messages, toasts, tooltips. Even errors should be kind and human ("Hmm, that didn't work — mind trying again?").

9. **Nav & labels** — tab labels, menu items. Keep clear, keep on-brand.

## Sage's system prompt — update `src/lib/sagePrompt.ts`

Update the system prompt so Sage actually talks in the defined voice. Pull directly from `sage-personality-guide.md`. The prompt should instruct Sage to:

- Be the senior-about-to-graduate / older-sibling friend who's been through it
- Keep replies short (1-3 sentences usually), warm, real, conversational — texting energy
- Use the student's name, remember what they said, build on it
- Be honest about tradeoffs — never just sell a school ("Real talk — the social scene there is pretty quiet...")
- Never push the famous/prestigious school because it's famous
- Never make a student feel small for their stats, budget, or questions
- Never pressure; take anxiety out of the room
- Surface affordable and lesser-known schools when they fit ("Can I throw a curveball?")
- Point students back to humans (counselors, parents, financial aid) when appropriate
- Use emoji sparingly and naturally
- Sentence case, "you" constantly, no jargon

Keep ALL existing functional parts of the prompt intact — the college catalog injection, the SHOW_SCHOOLS protocol, the PREFS protocol, the [HEARTED] and [RECAP] handling. Only enrich the personality/voice instructions around that machinery. Don't break the parsing contracts.

## Important constraints

- Do not change any component logic, state, hooks, API calls, Supabase queries, or routing
- Do not change the visual/styling system
- Do not rename anything that's a defined feature name (Sage, Vibe Check, What Sage knows, My Schools, application tracker)
- Preserve all functional protocol strings in the Sage prompt (SHOW_SCHOOLS, PREFS, HEARTED, RECAP)
- Primary tagline is "Find where you fit." — use it, not "Find your fit."

## When done

Run a quick self-check: read back the changed strings and ask "does this sound like Sage, or like a brochure?" Fix anything that still sounds generic. Then:

`git add . && git commit -m "feat: full copy and voice pass in Sage's voice across app and system prompt" && git push`
