import { createContext, useContext, useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { buildSagePrompt, type SageProfile } from '@/lib/sagePrompt'
import { useAuth } from './AuthContext'
import { useProfile } from './ProfileContext'
import { useColleges } from './CollegeContext'
import type { College } from '@/lib/colleges'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  metadata?: { schoolIds?: string[]; hidden?: boolean }
}

// Shown as static UI in the empty state and seeded into API context on first call
export const SAGE_GREETING =
  "Hey! I'm Sage — your personal college guide. I'll help you find schools that actually fit who you are, not just your GPA. Where should we start?"

interface ChatContextType {
  messages: ChatMessage[]
  sendMessage: (text: string) => Promise<void>
  loading: boolean
  initializing: boolean
  heartedSchools: Set<string>
  toggleHeart: (college: College) => void
  proactivePref: 'yes' | 'no' | null
}

const ChatContext = createContext<ChatContextType | null>(null)

function parseResponse(raw: string): { content: string; schoolIds?: string[]; prefs?: Record<string, unknown> } {
  let content = raw
  let schoolIds: string[] | undefined
  let prefs: Record<string, unknown> | undefined

  const schoolsMatch = content.match(/SHOW_SCHOOLS:(\[.*?\])/)
  if (schoolsMatch) {
    try { schoolIds = JSON.parse(schoolsMatch[1]) } catch { /* keep undefined */ }
    content = content.replace(schoolsMatch[0], '')
  }

  const prefsMatch = content.match(/PREFS:(\{.*?\})/)
  if (prefsMatch) {
    try { prefs = JSON.parse(prefsMatch[1]) } catch { /* keep undefined */ }
    content = content.replace(prefsMatch[0], '')
  }

  return { content: content.trim(), schoolIds, prefs }
}

async function callEdge(msgs: { role: string; content: string }[], colleges: College[], profile?: SageProfile): Promise<string> {
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ system: buildSagePrompt(colleges, profile), messages: msgs }),
  })
  const data = await resp.json()
  return data.content?.[0]?.text ?? "Sorry, something went wrong. Try again?"
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { profile: sageProfile, setProfile } = useProfile()
  const { colleges } = useColleges()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [heartedSchools, setHeartedSchools] = useState<Set<string>>(new Set())
  const [heartActionCount, setHeartActionCount] = useState(0)
  const [proactivePref] = useState<'yes' | 'no' | null>(null)
  const [userPrefs, setUserPrefs] = useState<{ preferred_states: string[]; max_tuition: number | null; preferred_majors: string[] } | null>(null)
  const userPrefsRef = useRef<typeof userPrefs>(null)
  userPrefsRef.current = userPrefs
  const sageProfileRef = useRef<typeof sageProfile>(null)
  sageProfileRef.current = sageProfile
  // Tracks which user's history we've already loaded to avoid duplicate loads
  const loadedForRef = useRef<string | null>(null)
  const recapSentRef = useRef(false)
  // Always-current snapshot of messages for use inside async callbacks
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages

  useEffect(() => {
    if (authLoading || !user) return
    if (loadedForRef.current === user.id) return
    loadedForRef.current = user.id
    loadUserData(user.id)
  }, [user, authLoading])

  // Fetches a fresh copy of user_preferences from Supabase (if signed in) and
  // merges with the chat-learned profile. Called before every Claude API call so
  // the system prompt always reflects the latest saved preferences.
  async function getLatestProfile(): Promise<SageProfile> {
    const sp = sageProfileRef.current
    let up = userPrefsRef.current

    if (user) {
      const { data } = await supabase
        .from('user_preferences')
        .select('preferred_states,max_tuition,preferred_majors')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        up = data
        setUserPrefs(data)
        userPrefsRef.current = data
      }
    }

    return {
      preferredLocations: sp?.preferredLocations,
      careerGoals: sp?.careerGoals,
      intendedMajor: sp?.intendedMajor,
      preferredStates: up?.preferred_states,
      maxTuition: up?.max_tuition,
      preferredMajors: up?.preferred_majors,
    }
  }

  async function loadUserData(userId: string) {
    setInitializing(true)
    try {
      const [msgRes, heartRes, prefsRes] = await Promise.all([
        supabase.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('hearted_schools').select('college_id').eq('user_id', userId),
        supabase.from('user_prefs').select('heart_action_count').eq('user_id', userId).single(),
      ])

      if (heartRes.data) {
        setHeartedSchools(new Set(heartRes.data.map((h: { college_id: string }) => h.college_id)))
      }
      if (prefsRes.data) {
        setHeartActionCount(prefsRes.data.heart_action_count ?? 0)
      }
      if (msgRes.data && msgRes.data.length > 0) {
        const loaded: ChatMessage[] = msgRes.data.map((m: {
          id: string; role: 'user' | 'assistant'; content: string; metadata?: { schoolIds?: string[] }
        }) => ({ id: m.id, role: m.role, content: m.content, metadata: m.metadata ?? undefined }))
        setMessages(loaded)
        if (!recapSentRef.current) {
          recapSentRef.current = true
          sendRecap(loaded, userId)
        }
      }
    } finally {
      setInitializing(false)
    }
  }

  async function sendRecap(history: ChatMessage[], userId: string) {
    setLoading(true)
    try {
      const apiMsgs = [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: '[RECAP]' },
      ]
      const profile = await getLatestProfile()
      const raw = await callEdge(apiMsgs, colleges, profile)
      const { content, schoolIds, prefs } = parseResponse(raw)
      const msg: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content,
        metadata: schoolIds ? { schoolIds } : undefined,
      }
      setMessages(prev => [...prev, msg])
      if (prefs) applyPrefs(prefs)
      // Persist Sage's recap response — but NOT the [RECAP] user message
      await supabase.from('chat_messages').insert({
        id: msg.id, user_id: userId, role: msg.role,
        content: msg.content, metadata: msg.metadata ?? null,
      })
    } catch (e) {
      console.error('Recap failed:', e)
    } finally {
      setLoading(false)
    }
  }

  function applyPrefs(prefs: Record<string, unknown>) {
    const locs = prefs.preferredLocations
    const goals = prefs.careerGoals
    const major = prefs.intendedMajor
    if (locs || goals || major) {
      setProfile({
        preferredLocations: Array.isArray(locs) ? (locs as string[]) : [],
        careerGoals: Array.isArray(goals) ? (goals as string[]) : [],
        intendedMajor: typeof major === 'string' && major ? major : undefined,
        complete: true,
      })
    }
  }

  async function persistMsg(msg: ChatMessage, userId: string) {
    await supabase.from('chat_messages').insert({
      id: msg.id, user_id: userId, role: msg.role,
      content: msg.content, metadata: msg.metadata ?? null,
    })
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setLoading(true)

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim() }
    const snapshot = messagesRef.current
    const nextMessages = [...snapshot, userMsg]
    setMessages(nextMessages)
    if (user) persistMsg(userMsg, user.id)

    try {
      // Seed the static greeting as context on the very first exchange
      let apiMsgs = nextMessages.map(m => ({ role: m.role, content: m.content }))
      if (snapshot.length === 0) {
        apiMsgs = [{ role: 'assistant', content: SAGE_GREETING }, ...apiMsgs]
      }

      const profile = await getLatestProfile()
      const raw = await callEdge(apiMsgs, colleges, profile)
      const { content, schoolIds, prefs } = parseResponse(raw)

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content,
        metadata: schoolIds ? { schoolIds } : undefined,
      }
      setMessages(prev => [...prev, assistantMsg])
      if (prefs) applyPrefs(prefs)
      if (user) await persistMsg(assistantMsg, user.id)
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: "Hmm, something went wrong. Try sending that again.",
      }])
    } finally {
      setLoading(false)
    }
  }

  // Sends a system event message (e.g. [HEARTED]) — bypasses the loading guard
  // so it can fire after a heart tap even if Sage was just typing.
  async function sendSystemEvent(text: string) {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: text,
      metadata: { hidden: true },
    }
    const snapshot = messagesRef.current
    const nextMessages = [...snapshot, userMsg]
    setMessages(nextMessages)
    if (user) persistMsg(userMsg, user.id)

    setLoading(true)
    try {
      const profile = await getLatestProfile()
      const raw = await callEdge(nextMessages.map(m => ({ role: m.role, content: m.content })), colleges, profile)
      const { content, schoolIds, prefs } = parseResponse(raw)
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content,
        metadata: schoolIds ? { schoolIds } : undefined,
      }
      setMessages(prev => [...prev, assistantMsg])
      if (prefs) applyPrefs(prefs)
      if (user) await persistMsg(assistantMsg, user.id)
    } catch {
      // Silent fail — system events are best-effort
    } finally {
      setLoading(false)
    }
  }

  async function toggleHeart(college: College) {
    const isHearted = heartedSchools.has(college.id)

    setHeartedSchools(prev => {
      const next = new Set(prev)
      isHearted ? next.delete(college.id) : next.add(college.id)
      return next
    })

    if (user) {
      if (isHearted) {
        await supabase.from('hearted_schools').delete().eq('user_id', user.id).eq('college_id', college.id)
      } else {
        await supabase.from('hearted_schools').insert({ user_id: user.id, college_id: college.id, college_name: college.name })
      }
    }

    if (!isHearted) {
      const newCount = heartActionCount + 1
      setHeartActionCount(newCount)
      if (user) {
        supabase.from('user_prefs').upsert({ user_id: user.id, heart_action_count: newCount })
      }
      // Notify Sage for first 3 hearts only; unhearting never notifies
      if (newCount <= 3 && !loading) {
        sendSystemEvent(`[HEARTED: ${college.name}]`)
      }
    }
  }

  return (
    <ChatContext.Provider value={{
      messages, sendMessage, loading, initializing,
      heartedSchools, toggleHeart, proactivePref,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside ChatProvider')
  return ctx
}

export const useChatContext = useChat
