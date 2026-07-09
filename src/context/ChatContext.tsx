import { createContext, useContext, useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type SageProfile } from '@/lib/sagePrompt'
import { useAuth } from './AuthContext'
import { useProfile, type StudentProfile } from './ProfileContext'
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
  // A guest just hearted their first school this session — prompt them to make
  // an account so it actually saves. Rendered once at the app shell (Layout).
  authNudgeOpen: boolean
  dismissAuthNudge: () => void
}

const ChatContext = createContext<ChatContextType | null>(null)

function parseResponse(raw: string): { content: string; schoolIds?: string[]; prefs?: Record<string, unknown> } {
  let content = raw
  let schoolIds: string[] | undefined
  let prefs: Record<string, unknown> | undefined

  const schoolsMatch = content.match(/SHOW_SCHOOLS:(\[.*?\])/)
  if (schoolsMatch) {
    try {
      const parsed = JSON.parse(schoolsMatch[1])
      // De-dupe: Sage occasionally repeats an id, which collides React keys and
      // renders the same school card twice.
      if (Array.isArray(parsed)) schoolIds = [...new Set(parsed.map(String))]
    } catch { /* keep undefined */ }
    content = content.replace(schoolsMatch[0], '')
  }

  const prefsMatch = content.match(/PREFS:(\{.*?\})/)
  if (prefsMatch) {
    try { prefs = JSON.parse(prefsMatch[1]) } catch { /* keep undefined */ }
    content = content.replace(prefsMatch[0], '')
  }

  return { content: content.trim(), schoolIds, prefs }
}

// Case-insensitive union that preserves the existing order and appends anything new.
function unionCI(a: string[] = [], b: string[] = []): string[] {
  const out = [...a]
  const seen = new Set(a.map(s => s.toLowerCase()))
  for (const item of b) {
    if (item && !seen.has(item.toLowerCase())) {
      out.push(item)
      seen.add(item.toLowerCase())
    }
  }
  return out
}

// Merge newly learned preferences into the existing profile instead of replacing
// it — so a later PREFS that omits a field (or sends an empty array) can't wipe
// what Sage already knew.
function mergeLearnedProfile(
  prev: StudentProfile | null,
  incoming: { preferredLocations?: string[]; careerGoals?: string[]; intendedMajor?: string },
): StudentProfile {
  const base = prev ?? { preferredLocations: [], careerGoals: [], intendedMajor: undefined, complete: false }
  const locs = (incoming.preferredLocations ?? []).filter(Boolean)
  const goals = (incoming.careerGoals ?? []).filter(Boolean)
  const major = typeof incoming.intendedMajor === 'string' ? incoming.intendedMajor.trim() : ''
  return {
    preferredLocations: locs.length ? unionCI(base.preferredLocations, locs) : base.preferredLocations,
    careerGoals: goals.length ? unionCI(base.careerGoals, goals) : base.careerGoals,
    intendedMajor: major || base.intendedMajor,
    complete: true,
  }
}

async function callEdge(msgs: { role: string; content: string }[], profile?: SageProfile): Promise<string> {
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    // The edge function builds the system prompt from `type` — it never accepts a
    // client-supplied system, so it can't be used as a general-purpose Claude proxy.
    body: JSON.stringify({ type: 'sage', messages: msgs, profile }),
  })
  // Throw on failure so the caller's catch shows a transient error instead of
  // persisting an error string to chat_messages as a real Sage turn.
  if (resp.status === 429) throw new Error('rate_limited')
  if (!resp.ok) throw new Error(`chat function error: ${resp.status}`)
  const data = await resp.json()
  const text = data.content?.[0]?.text
  if (typeof text !== 'string' || !text) throw new Error('empty chat response')
  return text
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { profile: sageProfile, setProfile, clearProfile } = useProfile()
  const { colleges } = useColleges()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  // A recap that's been decided on but is waiting for the college catalog to load
  // before firing — otherwise Sage gets an empty catalog and invents school IDs.
  const [recapPending, setRecapPending] = useState<{ userId: string; history: ChatMessage[] } | null>(null)
  const [heartedSchools, setHeartedSchools] = useState<Set<string>>(new Set())
  const heartedSchoolsRef = useRef<Set<string>>(new Set())
  heartedSchoolsRef.current = heartedSchools
  const [heartActionCount, setHeartActionCount] = useState(0)
  const heartActionCountRef = useRef(0)
  heartActionCountRef.current = heartActionCount
  // One gentle sign-up nudge per guest session, fired on their first new heart.
  // The ref survives route changes (provider never unmounts) so navigating
  // between hearts doesn't re-trigger it; a refresh resets it, which is fine —
  // that's also when their in-memory hearts are lost.
  const [authNudgeOpen, setAuthNudgeOpen] = useState(false)
  const heartNudgeShownRef = useRef(false)
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
  // Current catalog snapshot — needed to look up school names when migrating
  // guest hearts on sign-in, since the effect may run before colleges settle.
  const collegesRef = useRef<College[]>([])
  collegesRef.current = colleges

  useEffect(() => {
    if (authLoading) return
    const prevId = loadedForRef.current

    // Signed out, or switched to a different account: wipe the previous user's
    // session from memory so it can't linger on screen or leak into the next
    // account's context/persistence.
    if (prevId && (!user || user.id !== prevId)) {
      setMessages([])
      setHeartedSchools(new Set())
      setHeartActionCount(0)
      clearProfile()
      sageProfileRef.current = null
      recapSentRef.current = false
      setRecapPending(null)
      loadedForRef.current = null
    }

    if (!user) return
    if (loadedForRef.current === user.id) return
    // Only a genuine guest→sign-in (no prior signed-in user) carries local
    // session state up; an account switch must not migrate the old user's data.
    const wasGuest = !prevId
    loadedForRef.current = user.id
    loadUserData(
      user.id,
      wasGuest ? messagesRef.current : [],
      wasGuest ? heartedSchoolsRef.current : new Set<string>(),
    )
  }, [user, authLoading])

  // Fire a deferred recap once the college catalog is available, so Sage never
  // builds its system prompt (and picks school IDs) against an empty catalog.
  useEffect(() => {
    if (!recapPending || colleges.length === 0) return
    const { userId, history } = recapPending
    setRecapPending(null)
    sendRecap(history, userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recapPending, colleges])

  // Persist guest-session chat + hearts under the freshly signed-in user so the
  // "Save this conversation" promise actually holds.
  async function migrateGuestData(userId: string, localMessages: ChatMessage[], localHearts: Set<string>, serverHearts: Set<string>) {
    if (localMessages.length > 0) {
      try {
        await supabase.from('chat_messages').insert(
          localMessages.map(m => ({
            id: m.id, user_id: userId, role: m.role,
            content: m.content, metadata: m.metadata ?? null,
          })),
        )
      } catch (e) {
        console.error('Failed to migrate guest conversation:', e)
      }
    }

    const heartsToInsert = [...localHearts].filter(id => !serverHearts.has(id))
    if (heartsToInsert.length > 0) {
      const rows = heartsToInsert
        .map(id => {
          const c = collegesRef.current.find(col => col.id === id)
          return c ? { user_id: userId, college_id: c.id, college_name: c.name } : null
        })
        .filter(Boolean) as { user_id: string; college_id: string; college_name: string }[]
      if (rows.length > 0) {
        try {
          await supabase.from('hearted_schools').insert(rows)
        } catch (e) {
          console.error('Failed to migrate guest hearts:', e)
        }
      }
    }
  }

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

    const snapshot: SageProfile = {
      preferredLocations: sp?.preferredLocations,
      careerGoals: sp?.careerGoals,
      intendedMajor: sp?.intendedMajor,
      preferredStates: up?.preferred_states,
      maxTuition: up?.max_tuition,
      preferredMajors: up?.preferred_majors,
    }
    return snapshot
  }

  async function loadUserData(userId: string, localMessages: ChatMessage[], localHearts: Set<string>) {
    setInitializing(true)
    try {
      const [msgRes, heartRes, prefsRes] = await Promise.all([
        supabase.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('hearted_schools').select('college_id').eq('user_id', userId),
        supabase.from('user_preferences').select('heart_action_count,sage_profile').eq('user_id', userId).maybeSingle(),
      ])

      const serverHearts = new Set<string>((heartRes.data ?? []).map((h: { college_id: string }) => h.college_id))
      // Merge guest hearts with anything already saved on the server.
      setHeartedSchools(new Set<string>([...serverHearts, ...localHearts]))

      if (prefsRes.data) {
        setHeartActionCount(prefsRes.data.heart_action_count ?? 0)
      }

      // Restore the chat-learned profile. The server copy is authoritative (it
      // syncs across devices); if the account has none yet, push up whatever this
      // device already knows (e.g. a guest who just signed in).
      const dbProfile = (prefsRes.data?.sage_profile ?? null) as StudentProfile | null
      if (dbProfile) {
        setProfile(dbProfile)
        sageProfileRef.current = dbProfile
      } else if (sageProfileRef.current) {
        supabase.from('user_preferences').upsert(
          { user_id: userId, sage_profile: sageProfileRef.current },
          { onConflict: 'user_id' },
        )
      }

      // Persist any guest-session chat/hearts under this user before we settle state.
      await migrateGuestData(userId, localMessages, localHearts, serverHearts)

      const serverMsgs: ChatMessage[] = (msgRes.data ?? []).map((m: {
        id: string; role: 'user' | 'assistant'; content: string; metadata?: { schoolIds?: string[]; hidden?: boolean }
      }) => ({ id: m.id, role: m.role, content: m.content, metadata: m.metadata ?? undefined }))

      // Server history first, then any guest messages not already on the server.
      // Merge server history with whatever is on screen now — guest session plus
      // anything sent while this load was in flight — de-duped by id. The
      // functional form reads the latest state, so a message the user sent
      // mid-load isn't clobbered.
      setMessages(prev => {
        const ids = new Set(serverMsgs.map(m => m.id))
        return [...serverMsgs, ...prev.filter(m => !ids.has(m.id))]
      })

      // Recap only for genuinely returning users (existing server history),
      // not for a guest who just signed in mid-conversation. Defer the actual
      // send until the catalog is loaded (handled by the effect below).
      if (serverMsgs.length > 0) {
        const sessionKey = `sage_recap_sent_${userId}`
        if (!recapSentRef.current && !sessionStorage.getItem(sessionKey)) {
          recapSentRef.current = true
          sessionStorage.setItem(sessionKey, '1')
          setRecapPending({ userId, history: serverMsgs })
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
      const raw = await callEdge(apiMsgs, profile)
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

  // Persist the chat-learned profile to Supabase for signed-in users (guests are
  // covered by ProfileContext's localStorage mirror).
  function persistLearnedProfile(p: StudentProfile) {
    if (!user) return
    supabase.from('user_preferences').upsert(
      { user_id: user.id, sage_profile: p },
      { onConflict: 'user_id' },
    )
  }

  function applyPrefs(prefs: Record<string, unknown>) {
    const incoming = {
      preferredLocations: Array.isArray(prefs.preferredLocations) ? (prefs.preferredLocations as string[]) : undefined,
      careerGoals: Array.isArray(prefs.careerGoals) ? (prefs.careerGoals as string[]) : undefined,
      intendedMajor: typeof prefs.intendedMajor === 'string' ? prefs.intendedMajor : undefined,
    }
    const hasSignal =
      incoming.preferredLocations?.some(Boolean) ||
      incoming.careerGoals?.some(Boolean) ||
      !!incoming.intendedMajor?.trim()
    if (!hasSignal) return

    const merged = mergeLearnedProfile(sageProfileRef.current, incoming)
    setProfile(merged)
    sageProfileRef.current = merged
    persistLearnedProfile(merged)
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
      const raw = await callEdge(apiMsgs, profile)
      const { content, schoolIds, prefs } = parseResponse(raw)

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content,
        metadata: schoolIds ? { schoolIds } : undefined,
      }
      setMessages(prev => [...prev, assistantMsg])
      if (prefs) applyPrefs(prefs)
      if (user) await persistMsg(assistantMsg, user.id)
    } catch (e) {
      const rateLimited = e instanceof Error && e.message === 'rate_limited'
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: rateLimited
          ? "Whoa, you're going faster than I can keep up — give it a few seconds and try again."
          : "Hmm, something went wrong. Try sending that again.",
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
      const raw = await callEdge(nextMessages.map(m => ({ role: m.role, content: m.content })), profile)
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
      // Read/advance through the ref so two fast hearts don't both read the same
      // stale count and collapse into one increment.
      const newCount = heartActionCountRef.current + 1
      heartActionCountRef.current = newCount
      setHeartActionCount(newCount)
      if (user) {
        supabase.from('user_preferences').upsert({ user_id: user.id, heart_action_count: newCount }, { onConflict: 'user_id' })
      } else if (!heartNudgeShownRef.current) {
        // Guest just saved their first heart of the session. Let them know it
        // won't stick without an account — without blocking the heart itself,
        // and without nagging on every subsequent heart.
        heartNudgeShownRef.current = true
        setAuthNudgeOpen(true)
      }
      // Notify Sage for first 3 hearts only; unhearting never notifies
      if (newCount <= 3 && !loading) {
        sendSystemEvent(`[HEARTED: ${college.name}]`)
      }
    }
  }

  function dismissAuthNudge() {
    setAuthNudgeOpen(false)
  }

  return (
    <ChatContext.Provider value={{
      messages, sendMessage, loading, initializing,
      heartedSchools, toggleHeart, proactivePref,
      authNudgeOpen, dismissAuthNudge,
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
