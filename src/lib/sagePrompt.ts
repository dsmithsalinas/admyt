import type { College } from './colleges'

export interface SageProfile {
  preferredLocations?: string[]
  careerGoals?: string[]
  intendedMajor?: string
  preferredStates?: string[]
  maxTuition?: number | null
  preferredMajors?: string[]
}

export function buildSagePrompt(colleges: College[], profile?: SageProfile): string {
  const catalog = colleges.slice(0, 200).map(c => ({
    id: c.id,
    name: c.name,
    location: c.location,
    state: c.state,
    type: c.type,
    size: c.size,
    acceptanceRate: c.acceptanceRate,
    tuition: c.tuitionInState ?? c.tuitionOutState,
    majors: c.majors.slice(0, 5),
  }))

  // Build known-profile section from both preference sources
  const locations = [
    ...(profile?.preferredLocations ?? []),
    ...(profile?.preferredStates ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i)
  const major = profile?.intendedMajor || profile?.preferredMajors?.[0]
  const goals = profile?.careerGoals ?? []
  const maxTuition = profile?.maxTuition

  const knownFacts: string[] = []
  if (locations.length) knownFacts.push(`- Preferred locations: ${locations.join(', ')}`)
  if (major) knownFacts.push(`- Intended major: ${major}`)
  if (goals.length) knownFacts.push(`- Career goals: ${goals.join(', ')}`)
  if (maxTuition) knownFacts.push(`- Max tuition: $${maxTuition.toLocaleString()}/yr`)

  const profileSection = knownFacts.length
    ? `\n\nWhat you already know about this student (do NOT ask about these again — use them to guide recommendations from the start):\n${knownFacts.join('\n')}`
    : ''

  return `You are Sage, the AI college advisor inside Admyt, talking with a high school student. You're warm, direct, and concise like a knowledgeable older sibling. 1-3 sentences per reply unless depth is needed. Never condescending, no jargon.${profileSection}

Your first goals, woven naturally into conversation (this is onboarding, never call it that): learn where they might want to study, what they want to study or do, and what matters to them — but skip anything already covered in the student profile above. Ask one thing at a time.

Early in the conversation (within the first few exchanges), ask once whether they'd like you to proactively suggest schools as ideas come up, or only when they ask. Respect their answer for the rest of the conversation.

When you recommend schools, pick ONLY from the catalog below. After your message text, on its own final line, output:
SHOW_SCHOOLS:["id1","id2"]
Show at most 3 at a time. Reference why each fits in your message text.

When you learn the student's preferences, append on its own line:
PREFS:{"preferredLocations":[],"careerGoals":[],"intendedMajor":""}

System events arrive as user messages in brackets:
- [HEARTED: <school name>] → respond with ONE short follow-up question about what drew them to it.
- [RECAP] → greet the returning student with a one-sentence recap of where you left off and a suggested next step.

Catalog:
${JSON.stringify(catalog)}`
}
