import { useState, useRef, useEffect, useMemo } from 'react'
import { useChat } from '@/context/ChatContext'
import SageOrb from '@/components/sage/SageOrb'
import SchoolCard from '@/components/sage/SchoolCard'
import AuthModal from '@/components/ui/AuthModal'
import { useAuth } from '@/context/AuthContext'

const ACTION_TILES = [
  { label: 'Find where I fit', icon: '🎯', message: 'Help me find where I fit', bg: 'linear-gradient(140deg, #6366F1, #8B5CF6)' },
  { label: 'Check a school\'s vibe', icon: '✨', message: 'I want to run a Vibe Check on a school', bg: 'linear-gradient(140deg, #7C3AED, #A855F7)' },
  { label: 'I have no idea where to start', icon: '🧭', message: "I have no idea where to start with college", bg: 'linear-gradient(140deg, #4F46E5, #6366F1)' },
  { label: 'Compare two schools', icon: '⚖️', message: 'Can you compare two schools for me?', bg: 'linear-gradient(140deg, #EC4899, #F472B6)' },
]

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1',
          animation: `sageDotsbounce 1s ease-in-out ${i * 0.15}s infinite`,
        }} />
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
    () => ['Ask me anything...', 'What matters most to you?', 'Try: find something like NYU but warmer'][Math.floor(Math.random() * 3)],
    [],
  )

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isEmpty = messages.length === 0 && !loading && !initializing

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FCFCFF' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '28px 16px 8px' }}>

          {isEmpty && (
            <div style={{ animation: 'sageFadeUp 0.35s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <SageOrb size={76} />
                </div>
                <h1 style={{ fontSize: '23px', fontWeight: 500, color: '#15151C', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                  Hey, I'm Sage 👋
                </h1>
                <p style={{ fontSize: '13px', color: '#8B8B9E', margin: 0, lineHeight: 1.6 }}>
                  I'm here to help you find where you actually fit — not just where you're supposed to go. Where's your head at?
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                {ACTION_TILES.map(tile => (
                  <button
                    key={tile.message}
                    onClick={() => { if (!loading) sendMessage(tile.message) }}
                    style={{
                      background: tile.bg, borderRadius: '18px', padding: '14px', minHeight: '96px',
                      border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      justifyContent: 'space-between', alignItems: 'flex-start', color: 'white', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '9px',
                      background: 'rgba(255,255,255,0.28)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                    }}>
                      {tile.icon}
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: 500, lineHeight: 1.35 }}>{tile.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {initializing && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#A8A8BC', fontSize: '13px' }}>
              Picking up where you left off...
            </div>
          )}

          {messages.filter(m => !m.metadata?.hidden).map((msg) => (
            <div key={msg.id} style={{ marginBottom: '18px', animation: 'sageFadeUp 0.3s ease' }}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white',
                    borderRadius: '16px 16px 4px 16px', padding: '11px 15px',
                    fontSize: '13px', lineHeight: 1.6, maxWidth: '80%', wordBreak: 'break-word',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.2)',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <SageOrb size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#A8A8BC', fontWeight: 600, marginBottom: '5px', letterSpacing: '0.03em' }}>
                        SAGE
                      </div>
                      <div style={{
                        background: 'white', border: '1px solid #EEECFB',
                        borderRadius: '4px 16px 16px 16px', padding: '11px 14px',
                        fontSize: '13px', color: '#3A3A4D', lineHeight: 1.6,
                        display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word',
                        boxShadow: '0 2px 12px rgba(99,102,241,0.05)',
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                  {msg.metadata?.schoolIds && msg.metadata.schoolIds.length > 0 && (
                    <div style={{ marginTop: '12px', paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {msg.metadata.schoolIds.map(id => (
                        <SchoolCard key={id} collegeId={id} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '18px' }}>
              <SageOrb size={30} />
              <div>
                <div style={{ fontSize: '11px', color: '#A8A8BC', fontWeight: 600, marginBottom: '5px', letterSpacing: '0.03em' }}>SAGE</div>
                <div style={{ background: 'white', border: '1px solid #EEECFB', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', boxShadow: '0 2px 12px rgba(99,102,241,0.05)' }}>
                  <TypingDots />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div style={{ flexShrink: 0, background: '#FCFCFF', borderTop: '1px solid #F0EEFB', padding: '12px 16px' }}>
        {!user && messages.length >= 4 && (
          <div style={{
            maxWidth: '680px', margin: '0 auto 10px',
            background: '#F4F3FE', border: '1px solid #EEECFB',
            borderRadius: '10px', padding: '9px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <span style={{ fontSize: '12px', color: '#6366F1' }}>Save this conversation so you can come back to it</span>
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                fontSize: '11px', fontWeight: 500, color: 'white',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none', borderRadius: '20px', padding: '5px 12px', cursor: 'pointer', flexShrink: 0,
              }}
            >
              Save it
            </button>
          </div>
        )}
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'flex-end',
            background: 'white', borderRadius: '24px', border: '1px solid #ECEAFB',
            padding: '11px 11px 11px 16px', boxShadow: '0 4px 20px rgba(99,102,241,0.06)',
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
                fontSize: '14px', color: '#15151C',
                resize: 'none', outline: 'none', lineHeight: 1.5,
                maxHeight: '120px', overflowY: 'auto', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: !input.trim() || loading ? '#E8E6FD' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none', cursor: !input.trim() || loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8H14M8 2L14 8L8 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal trigger="general" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
      )}

      <style>{`
        @keyframes sageDotsbounce { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-5px);opacity:1} }
        @keyframes sageFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heartPop { 0%{transform:scale(1)} 50%{transform:scale(1.45)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  )
}
