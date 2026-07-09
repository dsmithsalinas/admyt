// The Sage system prompt (and the vibe/description prompts) are now built
// server-side in the chat edge function so the endpoint can't be used as a
// general-purpose Claude proxy. All that stays client-side is the profile shape
// the client sends to the edge function.
export interface SageProfile {
  preferredLocations?: string[]
  careerGoals?: string[]
  intendedMajor?: string
  preferredStates?: string[]
  maxTuition?: number | null
  preferredMajors?: string[]
}
