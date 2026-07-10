import { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowRight, Compass, Scale, Sparkles, Target } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import SageOrb from '@/components/sage/SageOrb'
import SchoolCard from '@/components/sage/SchoolCard'
import AuthModal from '@/components/ui/AuthModal'
import { useAuth } from '@/context/AuthContext'
import WhatSageKnows from '@/components/sage/WhatSageKnows'
import AdmytCard from '@/components/ui/AdmytCard'

const ACTION_TILES = [
  { label: 'Find where I fit', Icon: Target, message: 'Help me find where I fit', bg: 'var(--admyt-grad)' },
  { label: 'Check a school\'s vibe', Icon: Sparkles, message: 'I want to run a Vibe Check on a school', bg: 'linear-gradient(140deg, #8458f3, #d94f9d)' },
  { label: 'I have no idea where to start', Icon: Compass, message: "I have no idea where to start with college", bg: 'linear-gradient(140deg, #21b8a5, #635bff)' },
  { label: 'Compare two schools', Icon: Scale, message: 'Can you compare two schools for me?', bg: 'linear-gradient(140deg, #ff7a66, #d94f9d)' },
]

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '8px', height: '8px', borderRadius: '50%', background: 'var(--admyt-indigo)',
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'radial-gradient(circle at 12% 6%, rgba(33,184,165,.12), transparent 28%), radial-gradient(circle at 86% 4%, rgba(255,122,102,.12), transparent 28%), var(--admyt-paper)', padding: '28px clamp(16px, 3vw, 42px)' }}>
      <div style={{ flex: 1, overflow: 'hidden', maxWidth: '1120px', width: '100%', margin: '0 auto', border: '1px solid var(--admyt-line)', borderBottom: 'none', borderRadius: '12px 12px 0 0', background: 'rgba(255,255,255,.72)', boxShadow: 'var(--admyt-shadow)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ minHeight: '54px', borderBottom: '1px solid var(--admyt-line)', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,.82)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--admyt-muted)', fontSize: '13px', fontWeight: 760 }}>
            <SageOrb size={30} />
            Chat with Sage
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div className="sage-home-grid" style={{ minHeight: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 330px', gap: 0, alignItems: 'stretch', background: 'linear-gradient(180deg, #fffdfa 0%, #faf8ff 100%)' }}>
          <div style={{ minWidth: 0, padding: '24px clamp(16px, 3vw, 48px)' }}>

          {isEmpty && (
            <div style={{ animation: 'sageFadeUp 0.35s ease' }}>
              <AdmytCard tone="soft" style={{ textAlign: 'left', marginBottom: '18px', padding: '22px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '-60px -40px auto auto', width: '190px', height: '190px', background: 'rgba(33,184,165,0.16)', borderRadius: '50%' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <SageOrb size={48} animate />
                  <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--admyt-ink)', letterSpacing: '0', margin: 0 }}>
                  Hey, I'm Sage 👋
                  </h1>
                </div>
                <p style={{ fontSize: '15px', color: 'var(--admyt-slate)', margin: 0, lineHeight: 1.65, maxWidth: '660px' }}>
                  I'm here to help you find where you actually fit — not just where you're supposed to go. Where's your head at?
                </p>
              </AdmytCard>
              <div className="sage-mobile-knows" style={{ display: 'none', marginBottom: '14px' }}>
                <WhatSageKnows compact />
              </div>
              <div className="sage-action-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                {ACTION_TILES.map(tile => (
                  <button
                    key={tile.message}
                    onClick={() => { if (!loading) sendMessage(tile.message) }}
                    style={{
                      background: 'white', borderRadius: '999px', padding: '10px 12px', minHeight: 'auto',
                      border: '1px solid var(--admyt-line)', cursor: 'pointer', display: 'flex', flexDirection: 'row',
                      justifyContent: 'flex-start', alignItems: 'center', color: 'var(--admyt-slate)', textAlign: 'left',
                      boxShadow: 'none', gap: '12px',
                    }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: tile.bg,
                      color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <tile.Icon size={17} />
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 740, lineHeight: 1.35 }}>
                      {tile.label} <ArrowRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {initializing && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admyt-faint)', fontSize: '13px' }}>
              Picking up where you left off...
            </div>
          )}

          {messages.filter(m => !m.metadata?.hidden).map((msg) => (
            <div key={msg.id} style={{ marginBottom: '18px', animation: 'sageFadeUp 0.3s ease' }}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    background: 'var(--admyt-grad)', color: 'white',
                    borderRadius: '16px 16px 4px 16px', padding: '11px 15px',
                    fontSize: '13px', lineHeight: 1.6, maxWidth: '80%', wordBreak: 'break-word',
                    boxShadow: 'var(--shadow-float)',
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
                        Sage
                      </div>
                      <div style={{
                        background: 'rgba(255,253,250,0.96)', border: '1px solid var(--admyt-line)',
                        borderRadius: '4px 16px 16px 16px', padding: '11px 14px',
                        fontSize: '13px', color: 'var(--admyt-slate)', lineHeight: 1.6,
                        display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word',
                        boxShadow: 'var(--shadow-soft)',
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                  {msg.metadata?.schoolIds && msg.metadata.schoolIds.length > 0 && (
                    <div className="sage-school-stack" style={{ marginTop: '12px', paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                <div style={{ fontSize: '11px', color: 'var(--admyt-faint)', fontWeight: 700, marginBottom: '5px', letterSpacing: '0.03em' }}>Sage</div>
                <div style={{ background: 'rgba(255,253,250,0.96)', border: '1px solid var(--admyt-line)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', boxShadow: 'var(--shadow-soft)' }}>
                  <TypingDots />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
          </div>
          <aside className="sage-desktop-knows" style={{ borderLeft: '1px solid var(--admyt-line)', background: 'rgba(255,255,255,.68)', padding: '18px' }}>
            <WhatSageKnows />
          </aside>
        </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, maxWidth: '1120px', width: '100%', margin: '0 auto', background: 'rgba(255,253,250,0.9)', border: '1px solid var(--admyt-line)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '12px 16px', backdropFilter: 'blur(14px)' }}>
        {!user && messages.filter(m => !m.metadata?.hidden).length >= 4 && (
          <div style={{
            maxWidth: '680px', margin: '0 auto 10px',
            background: 'var(--admyt-grad-soft)', border: '1px solid var(--admyt-line)',
            borderRadius: '12px', padding: '9px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--admyt-indigo)', fontWeight: 700 }}>Save this conversation so you can come back to it</span>
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                fontSize: '11px', fontWeight: 500, color: 'white',
                background: 'var(--admyt-grad)',
                border: 'none', borderRadius: '20px', padding: '5px 12px', cursor: 'pointer', flexShrink: 0,
              }}
            >
              Save it
            </button>
          </div>
        )}
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'flex-end',
            background: 'white', borderRadius: '12px', border: '1px solid var(--admyt-line)',
            padding: '11px 11px 11px 16px', boxShadow: 'var(--shadow-input)',
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
                fontSize: '14px', color: 'var(--admyt-ink)',
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
                background: !input.trim() || loading ? '#E8E6FD' : 'var(--admyt-grad)',
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
        @media (max-width: 900px) {
          .sage-home-grid { grid-template-columns: 1fr !important; max-width: 720px !important; }
          .sage-desktop-knows { display: none !important; }
          .sage-mobile-knows { display: block !important; }
        }
        @media (max-width: 520px) {
          .sage-action-grid { grid-template-columns: 1fr !important; }
          .sage-school-stack { padding-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
