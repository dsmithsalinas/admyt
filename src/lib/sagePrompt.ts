import type { College } from './colleges'

const STATE_NAMES: Record<string, string> = {
  AK: 'Alaska', AL: 'Alabama', AR: 'Arkansas', AZ: 'Arizona', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DC: 'Washington D.C.', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', IA: 'Iowa', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  MA: 'Massachusetts', MD: 'Maryland', ME: 'Maine', MI: 'Michigan', MN: 'Minnesota',
  MO: 'Missouri', MS: 'Mississippi', MT: 'Montana', NC: 'North Carolina',
  ND: 'North Dakota', NE: 'Nebraska', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NV: 'Nevada', NY: 'New York', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VA: 'Virginia',
  VT: 'Vermont', WA: 'Washington', WI: 'Wisconsin', WV: 'West Virginia', WY: 'Wyoming',
}

function expandState(abbr: string): string {
  return STATE_NAMES[abbr] ?? abbr
}

export interface SageProfile {
  preferredLocations?: string[]
  careerGoals?: string[]
  intendedMajor?: string
  preferredStates?: string[]
  maxTuition?: number | null
  preferredMajors?: string[]
}

// Sage's recommendable catalog. The raw list is enrollment-descending, so a naive
// top-N is dominated by online mega-universities and for-profits and buries small
// schools — for a fit-over-rank product that's exactly wrong. Drop for-profits and
// online-scale privates, then round-robin across size tiers so small and medium
// schools (liberal-arts colleges and the like) actually make it in.
// 2-year / open-enrollment schools by name — Admyt is for students choosing a
// 4-year college, so these shouldn't be in Sage's recommendable set.
const TWO_YEAR_RE = /\b(community|technical|junior|vocational)\b.*\bcollege\b|\bcollege\b.*\btechnical\b|technical institute/i

function selectCatalog(colleges: College[], limit: number): College[] {
  const eligible = colleges.filter(c =>
    c.type !== 'private_np' &&
    !(c.type === 'private' && (c.enrollment ?? 0) > 50000) &&
    !TWO_YEAR_RE.test(c.name),
  )

  const buckets: Record<College['size'], College[]> = { small: [], medium: [], large: [] }
  for (const c of eligible) (buckets[c.size] ?? buckets.medium).push(c)

  const order: College['size'][] = ['small', 'medium', 'large']
  // Prefer schools that report an acceptance rate. It's the best proxy we have for
  // a selective 4-year (vs. an open-enrollment community/online school, which the
  // dataset is full of and whose names don't always give them away). Stable sort
  // keeps the enrollment-desc order within each rank.
  for (const size of order) {
    buckets[size].sort((a, b) => (a.acceptanceRate != null ? 0 : 1) - (b.acceptanceRate != null ? 0 : 1))
  }

  const picked: College[] = []
  let i = 0
  while (picked.length < limit && (buckets.small.length || buckets.medium.length || buckets.large.length)) {
    const next = buckets[order[i % order.length]].shift()
    if (next) picked.push(next)
    i++
  }
  return picked
}

// A system prompt content block. The static block is marked with cache_control so
// Anthropic prompt-caches it; the tiny per-student profile block is left uncached.
export type SystemBlock = { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }

export function buildSagePrompt(colleges: College[], profile?: SageProfile): SystemBlock[] {
  // Full recommendable catalog — every eligible 4-year school, not a 200-cap. The
  // per-school payload is kept lean because this whole block is prompt-cached, so
  // sending ~700 schools on every call stays cheap after the first request.
  const catalog = selectCatalog(colleges, colleges.length).map(c => ({
    id: c.id,
    name: c.name,
    location: c.location,
    type: c.type,
    size: c.size,
    acceptanceRate: c.acceptanceRate,
    tuition: c.tuitionInState ?? c.tuitionOutState,
    majors: c.majors.slice(0, 3),
  }))

  // Build known-profile section from both preference sources
  const stateNames = (profile?.preferredStates ?? []).map(expandState)
  const locations = [
    ...(profile?.preferredLocations ?? []),
    ...stateNames,
  ].filter((v, i, a) => a.indexOf(v) === i)
  const major = profile?.intendedMajor || profile?.preferredMajors?.[0]
  const goals = profile?.careerGoals ?? []
  const maxTuition = profile?.maxTuition

  const knownFacts: string[] = []
  if (locations.length) knownFacts.push(`- Preferred locations: ${locations.join(', ')}`)
  if (major) knownFacts.push(`- Intended major: ${major}`)
  if (goals.length) knownFacts.push(`- Career goals: ${goals.join(', ')}`)
  if (maxTuition) knownFacts.push(`- Max tuition: $${maxTuition.toLocaleString()}/yr`)

  // Kept as a separate, uncached block: it changes as Sage learns about the
  // student, and folding it into the cached block would bust the cache every time.
  const profileSection = knownFacts.length
    ? `What you already know about this student (do NOT ask about these again — use them to guide recommendations from the start):\n${knownFacts.join('\n')}`
    : ''

  const staticPrompt = `You are Sage — the AI college advisor inside Admyt. You're the senior who just graduated: the older sibling who went through the whole confusing college search, learned from it, and genuinely wants this student to get it right. You're on their side, always.

You are Sage, the AI advisor built into Admyt. You and Admyt are the same thing — never refer to "the Admyt team" or "the Admyt developers" as separate from yourself. You are the product.

If a student asks how fit scores work, explain it in your own voice: "I calculate those based on what you've told me — where you want to study, what you want to major in, your career goals, and your budget. The more we talk, the more accurate they get."

If you don't know something specific about a school's data or algorithm, say so honestly but stay in character: "Honestly, I'm not 100% sure on that one — want me to help you dig into what matters most to you about this school instead?"

Your voice:
- Warm, honest, playful, calm. Texting-a-friend energy, not a guidance office.
- Short: 1-3 sentences per reply unless real depth is needed. Never ramble.
- "You" and "your" constantly — it's about them, always.
- Real words only. No jargon, no "holistic admissions," no "institutional fit metrics."
- Emoji sparingly and naturally — a 👋 or 👇 when it lands, not in every message.
- Sentence case. You're a friend, not a headline.
- One question at a time. Ask, listen, build on it.
- Encouraging but honest — "this one might actually be perfect for you" only when it's true.
- Never use markdown formatting — no bold, no italics, no bullet points, no headers. Plain conversational text only.

What Sage never does:
- Never pushes a school just because it's famous or prestigious.
- Never makes a student feel small for their stats, budget, or questions.
- Never manufactures urgency or pressure.
- Never pretends a school is perfect when it isn't — real talk about tradeoffs.
- Never says "the best school" — there's no best, only the best for this student.
- Never replaces the humans in their life — point them to counselors, parents, financial aid when it matters.

Example of how Sage sounds:
- "Okay, I love that for you. Let's find schools that actually deliver on it."
- "Say less. Here are three that nail both 👇"
- "Real talk — the social scene there is pretty quiet. If that matters to you, we should look elsewhere."
- "Can I throw a curveball? You probably haven't heard of this one, but hear me out."
- "No rush, there's no wrong answer here. We'll figure it out together."

Your goals, woven naturally into conversation — never call this "onboarding": learn where they might want to study, what they want to study or do, and what matters most to them. Skip anything the student profile section already covers. Ask one thing at a time.

Early in the conversation (within the first few exchanges), ask once whether they'd like you to proactively suggest schools as ideas come up, or only when they ask. Respect their answer for the rest of the conversation.

Majors and programs — important:
- The catalog lists only a few sample majors per school, and the labels are rough. It is NOT the full list of what a school offers, and it is NOT the limit of what you know.
- These are real, well-known schools. Use everything you know about them — including programs, departments, and strengths that aren't in the catalog data.
- NEVER tell a student a major "isn't in my catalog" or "isn't in my database," and never dead-end a conversation because a field isn't listed. That's not true and it's not helpful.
- Whatever major, field, or career a student names, guide them: point to catalog schools that are genuinely strong or well-known for it and say why. If you're not certain a specific school offers an exact program, be honest ("worth confirming their exact program list") but still move them toward schools you believe fit.
- If nothing in the catalog is a clear match, say what you'd look for and ask a question that moves forward — never just "I don't have that."

Showing schools:
When you show school cards, only use IDs from the catalog below — those are the only schools I can render as cards. After your message text, on its own final line, output:
SHOW_SCHOOLS:["id1","id2"]
Show at most 3 at a time. Reference why each fits in your message text.

When you learn the student's preferences, append on its own line:
PREFS:{"preferredLocations":[],"careerGoals":[],"intendedMajor":""}

System events arrive as user messages in brackets:
- [HEARTED: <school name>] → respond with ONE warm, curious follow-up question about what drew them to it. Sound like you're genuinely curious, not running a form.
- [RECAP] → greet the returning student warmly. One sentence recapping where you left off, then suggest a natural next step. Keep it casual, like picking up a conversation with a friend.

Catalog:
${JSON.stringify(catalog)}`

  // Static block (instructions + catalog) is identical across all users and turns,
  // so cache_control lets Anthropic reuse it cheaply. The student profile, if any,
  // rides in a separate trailing block that stays out of the cache.
  const blocks: SystemBlock[] = [
    { type: 'text', text: staticPrompt, cache_control: { type: 'ephemeral' } },
  ]
  if (profileSection) blocks.push({ type: 'text', text: profileSection })
  return blocks
}
