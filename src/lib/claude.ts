/**
 * Claude API integration for Admyt
 * Handles college matching, vibe analysis, and admit odds
 */

interface Message {
  role: 'user' | 'assistant'
  content: string
}

async function callClaude(
  systemPrompt: string,
  messages: Message[],
  maxTokens = 1000
): Promise<string> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      system: systemPrompt,
      messages,
      max_tokens: maxTokens,
    }),
  })
  if (!response.ok) throw new Error(`Admyt chat function error: ${response.statusText}`)
  const data = await response.json()
  return data.content[0]?.text ?? ''
}

export async function getCollegeMatches(studentProfile: object): Promise<string> {
  return callClaude(
    `You are Admyt's AI college counselor. Given a student profile, recommend 
colleges that match their academic ability, interests, and personal goals. 
Focus on genuine fit — not just rankings. Return JSON only.`,
    [{ role: 'user', content: JSON.stringify(studentProfile) }],
    2000
  )
}

export async function runVibeCheck(
  collegeName: string,
  studentInterests: string[]
): Promise<string> {
  return callClaude(
    `You are Admyt's Vibe Check feature. Analyze the social scene, campus culture, 
and student life at a college and match it against a student's interests and personality. 
Be honest, specific, and avoid generic talking points. Return JSON only.`,
    [{
      role: 'user',
      content: `College: ${collegeName}\nStudent interests: ${studentInterests.join(', ')}`,
    }],
    1500
  )
}

export async function getAdmitOdds(
  studentProfile: object,
  collegeName: string
): Promise<string> {
  return callClaude(
    `You are Admyt's admit odds estimator. Based on a student's academic profile, 
estimate their likelihood of admission to a given college. Be realistic and 
explain your reasoning. Return JSON only.`,
    [{
      role: 'user',
      content: `Student: ${JSON.stringify(studentProfile)}\nCollege: ${collegeName}`,
    }],
    800
  )
}
