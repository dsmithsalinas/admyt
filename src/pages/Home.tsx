import { useState, useRef, useEffect, useMemo } from 'react'
import { useChat, SAGE_GREETING } from '@/context/ChatContext'
import SageAvatar from '@/components/sage/SageAvatar'
import SchoolCard from '@/components/sage/SchoolCard'
import AuthModal from '@/components/ui/AuthModal'
import { useAuth } from '@/context/AuthContext'

const PLACEHOLDERS = [
  'Ask about schools...',
  'What matters most to you?',
  'Try: find me something like NYU but warmer',
]

const SUGGESTION_CHIPS = [
  'Help me find my fit',
  'I have no idea where to start',
  'Compare two schools for me',
]

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#6366F1',
            animation: `sageDotsbounce 1s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const { messages, sendMessage, loading, initializing } = useChat()
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const placeholder = useMemo(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)],
    [],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-grow textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    sendMessage(text)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChip(chip: string) {
    if (loading) return
    sendMessage(chip)
  }

  const isEmpty = messages.length === 0 && !loading && !initializing

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
      {/* ── Thread ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '28px 16px 8px' }}>

          {/* Empty state */}
          {isEmpty && (
            <div style={{ animation: 'sageFadeUp 0.35s ease' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
                <SageAvatar size={36} />
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginBottom: '5px', letterSpacing: '0.03em' }}>
                    SAGE
                  </div>
                  <div style={{
                    background: 'white', border: '0.5px solid #E2E8F0',
                    borderRadius: '14px', padding: '12px 16px',
                    fontSize: '14px', color: '#334155', lineHeight: 1.65,
                    maxWidth: '420px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    {SAGE_GREETING}
                  </div>
                </div>
              </div>

              <div style={{ paddingLeft: '46px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUGGESTION_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleChip(chip)}
                    style={{
                      background: 'white', border: '0.5px solid #E2E8F0',
                      borderRadius: '100px', padding: '8px 15px',
                      fontSize: '13px', color: '#475569', fontWeight: 500,
                      cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#6366F1'
                      e.currentTarget.style.color = '#6366F1'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#E2E8F0'
                      e.currentTarget.style.color = '#475569'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Initializing placeholder */}
          {initializing && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '13px' }}>
              Loading your conversation...
            </div>
          )}

          {/* Message thread */}
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: '18px', animation: 'sageFadeUp 0.3s ease' }}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    background: '#6366F1', color: 'white',
                    borderRadius: '14px', padding: '10px 16px',
                    fontSize: '14px', lineHeight: 1.6,
                    maxWidth: '72%', wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <SageAvatar size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginBottom: '5px', letterSpacing: '0.03em' }}>
                        SAGE
                      </div>
                      <div style={{
                        background: 'white', border: '0.5px solid #E2E8F0',
                        borderRadius: '14px', padding: '10px 16px',
                        fontSize: '14px', color: '#334155', lineHeight: 1.65,
                        display: 'inline-block', maxWidth: '100%',
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>

                  {/* School cards — rendered wider than the bubble */}
                  {msg.metadata?.schoolIds && msg.metadata.schoolIds.length > 0 && (
                    <div style={{ marginTop: '12px', paddingLeft: '42px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {msg.metadata.schoolIds.map(id => (
                        <SchoolCard key={id} collegeId={id} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '18px' }}>
              <SageAvatar size={32} />
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginBottom: '5px', letterSpacing: '0.03em' }}>
                  SAGE
                </div>
                <div style={{
                  background: 'white', border: '0.5px solid #E2E8F0',
                  borderRadius: '14px', padding: '12px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <TypingDots />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ─────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: 'white',
        borderTop: '0.5px solid #E2E8F0',
        padding: '12px 16px',
        // Extra bottom padding on mobile is handled by the tab bar's position:fixed
      }}>
        {/* Sign-in nudge for guests who have sent messages */}
        {!user && messages.length >= 4 && (
          <div style={{
            maxWidth: '680px', margin: '0 auto 10px',
            background: '#EEF2FF', border: '0.5px solid #C7D2FE',
            borderRadius: '10px', padding: '9px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <span style={{ fontSize: '12px', color: '#4338CA' }}>
              Sign in to save this conversation
            </span>
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                background: '#6366F1', color: 'white', border: 'none',
                borderRadius: '6px', padding: '5px 12px',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Sign in
            </button>
          </div>
        )}

        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'flex-end',
            background: '#F8FAFC', borderRadius: '14px',
            border: '0.5px solid #E2E8F0',
            padding: '8px 8px 8px 14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder={placeholder}
              rows={1}
              disabled={loading}
              style={{
                flex: 1, border: 'none', background: 'none',
                fontSize: '14px', color: '#334155',
                resize: 'none', outline: 'none', lineHeight: 1.5,
                maxHeight: '120px', overflowY: 'auto',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: '36px', height: '36px',
                borderRadius: '10px', border: 'none',
                background: input.trim() && !loading ? '#6366F1' : '#E2E8F0',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 8H14M8 2L14 8L8 14"
                  stroke={input.trim() && !loading ? 'white' : '#94A3B8'}
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          trigger="general"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      <style>{`
        @keyframes sageDotsbounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes sageFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heartPop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.45); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
