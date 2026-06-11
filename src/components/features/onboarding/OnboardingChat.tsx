import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'assistant' | 'user'
  content: string
}

interface ExtractedProfile {
  preferredLocations: string[]
  careerGoals: string[]
  intendedMajor?: string
  complete: boolean
}

const SYSTEM_PROMPT = `You are Admyt's friendly onboarding assistant helping a high school student find the right college.
Your job is to have a short, warm, conversational chat to learn two things:
1. Where they'd like to go to college (location preferences — states, regions, near home vs. far, urban vs. rural, etc.)
2. What they want to study or do as a career

Keep responses short — 1-3 sentences max. Be casual and encouraging, like a cool older sibling.
Ask one thing at a time. After 3-4 exchanges when you have enough info, end with a JSON block like this on its own line:

PROFILE_EXTRACTED:{"preferredLocations":["California","East Coast"],"careerGoals":["software engineering","startups"],"intendedMajor":"Computer Science","complete":true}

Start by introducing yourself briefly and asking where they're thinking about going to college.`

function extractProfile(messages: Message[]): ExtractedProfile | null {
  for (const msg of [...messages].reverse()) {
    if (msg.role === 'assistant' && msg.content.includes('PROFILE_EXTRACTED:')) {
      const match = msg.content.match(/PROFILE_EXTRACTED:(\{.*\})/)
      if (match) {
        try {
          return JSON.parse(match[1])
        } catch {
          return null
        }
      }
    }
  }
  return null
}

function cleanContent(content: string): string {
  return content.replace(/PROFILE_EXTRACTED:\{.*\}/, '').trim()
}

interface OnboardingChatProps {
  onComplete: (profile: ExtractedProfile) => void
  onSkip: () => void
}

export default function OnboardingChat({ onComplete, onSkip }: OnboardingChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(userText?: string) {
    const outgoing = userText ?? input.trim()
    if (!outgoing && started) return

    setLoading(true)
    setInput('')

    const updated: Message[] = started
      ? [...messages, { role: 'user', content: outgoing }]
      : messages

    if (started) setMessages(updated)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: updated.length > 0 ? updated : [{ role: 'user', content: 'start' }],
        }),
      })

      const data = await response.json()
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't connect. Try again?"

      const next: Message[] = [
        ...updated,
        { role: 'assistant', content: reply },
      ]
      setMessages(next)
      setStarted(true)

      const extracted = extractProfile(next)
      if (extracted?.complete) {
        setTimeout(() => onComplete(extracted), 1200)
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Hmm, something went wrong. Try sending that again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--color-background-primary)',
      borderRadius: '16px',
      border: '0.5px solid var(--color-border-tertiary)',
      overflow: 'hidden',
    }}>
      <div style={{
        background: '#0F172A',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: '#6366F1',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 30 30" fill="none">
              <path d="M15 5 L26 11 L15 17 L4 11 Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 14 L8 21 Q8 24 15 24 Q22 24 22 21 L22 14" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="26" cy="11" r="1.5" fill="#F0ABFC"/>
              <path d="M26 11 L26 20" stroke="#F0ABFC" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#FFFFFF' }}>
              adm<span style={{ color: '#818CF8' }}>y</span>t
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>AI college guide</div>
          </div>
        </div>
        <button
          onClick={onSkip}
          style={{
            fontSize: '12px', color: '#64748B',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', borderRadius: '6px',
          }}
        >
          skip for now
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '280px',
        maxHeight: '340px',
      }}>
        {!started && !loading && (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Takes about 2 minutes. We'll use this to find schools that actually fit you.
            </p>
            <button
              onClick={() => sendMessage('start')}
              style={{
                background: '#6366F1', color: 'white',
                border: 'none', borderRadius: '8px',
                padding: '10px 20px', fontSize: '14px',
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              Let's go
            </button>
          </div>
        )}

        {messages.map((msg, i) => {
          const isAI = msg.role === 'assistant'
          const text = cleanContent(msg.content)
          if (!text) return null
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: isAI ? 'flex-start' : 'flex-end',
              }}
            >
              <div style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                background: isAI ? 'var(--color-background-secondary)' : '#6366F1',
                color: isAI ? 'var(--color-text-primary)' : '#FFFFFF',
                fontSize: '14px',
                lineHeight: '1.5',
              }}>
                {text}
              </div>
            </div>
          )
        })}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: '4px 14px 14px 14px',
              background: 'var(--color-background-secondary)',
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#6366F1', opacity: 0.5,
                  animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {started && (
        <div style={{
          padding: '12px 16px',
          borderTop: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', gap: '8px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your answer..."
            disabled={loading}
            style={{
              flex: 1, padding: '10px 14px',
              borderRadius: '8px', fontSize: '14px',
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              background: '#6366F1', color: 'white',
              border: 'none', borderRadius: '8px',
              padding: '10px 16px', fontSize: '14px',
              cursor: input.trim() ? 'pointer' : 'default',
              opacity: input.trim() ? 1 : 0.4,
            }}
          >
            Send
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
