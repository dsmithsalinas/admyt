import { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowRight, Compass, Scale, Sparkles, Target } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useChat } from '@/context/ChatContext'
import SageOrb from '@/components/sage/SageOrb'
import SchoolCard from '@/components/sage/SchoolCard'
import AuthModal from '@/components/ui/AuthModal'
import { useAuth } from '@/context/AuthContext'
import WhatSageKnows from '@/components/sage/WhatSageKnows'
import { useSageTransition } from '@/context/SageTransitionContext'

interface VibeContext {
  collegeId: string
  collegeName: string
  fitScore: number
}

interface ChatLocationState {
  vibeContext?: VibeContext
}

const ACTION_TILES = [
  { label: 'Find where I fit', Icon: Target, message: 'Help me find where I fit', bg: 'var(--admyt-grad)' },
  { label: 'Check a school\'s vibe', Icon: Sparkles, message: 'I want to run a Vibe Check on a school', bg: 'linear-gradient(140deg, #8458f3, #d94f9d)' },
  { label: 'I have no idea where to start', Icon: Compass, message: "I have no idea where to start with college", bg: 'linear-gradient(140deg, #21b8a5, #635bff)' },
  { label: 'Compare two schools', Icon: Scale, message: 'Can you compare two schools for me?', bg: 'linear-gradient(140deg, #ff7a66, #d94f9d)' },
]

function TypingDots() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 0' }}>
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
  const { destinationRef, isTransitioning } = useSageTransition()
  const location = useLocation()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [vibeContext, setVibeContext] = useState<VibeContext | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const placeholder = useMemo(
    () => ['Ask me anything...', 'What matters most to you?', 'Try: find something like NYU but warmer'][Math.floor(Math.random() * 3)],
    [],
  )
  const visibleMessages = useMemo(
    () => messages.filter(m => {
      if (m.metadata?.hidden) return false
      if (m.role === 'user') return true
      return m.content.trim().length > 0 || (m.metadata?.schoolIds?.length ?? 0) > 0
    }),
    [messages],
  )

  useEffect(() => {
    if (visibleMessages.length === 0 && !loading) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [visibleMessages.length, loading])

  useEffect(() => {
    const incoming = (location.state as ChatLocationState | null)?.vibeContext
    if (!incoming) return
    setVibeContext(incoming)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    const activeVibeContext = vibeContext
    setInput('')
    setVibeContext(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    sendMessage(text, activeVibeContext ? {
      apiText: [
        `Context: This question is about the student's Vibe Check for ${activeVibeContext.collegeName}.`,
        `Vibe Check fit score: ${activeVibeContext.fitScore}/100.`,
        `College id: ${activeVibeContext.collegeId}.`,
        `Student question: ${text}`,
      ].join('\n'),
    } : undefined)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isEmpty = visibleMessages.length === 0 && !loading && !initializing

  return (
    <div className={`sage-space${isTransitioning ? ' is-arriving' : ''}`}>
      <h1 className="sr-only">Talk with Sage</h1>
      <div className="sage-space-stars" aria-hidden="true" />
      <div className="sage-space-orbit" aria-hidden="true" />

      <aside className="sage-presence">
        <div ref={destinationRef} className="sage-arrival-orb">
          <SageOrb size={112} animate={!isTransitioning} />
        </div>
        <div className="sage-presence-copy">
          <span className="sage-presence-status"><i /> Sage is here</span>
          <div className="sage-presence-heading">Let’s find your place.</div>
          <p>No perfect answers needed. Just tell me what’s on your mind.</p>
        </div>
      </aside>

      <section className="sage-conversation-shell">
        <div className="sage-conversation-scroll">
          <div className="sage-conversation-inner" role="log" aria-live="polite" aria-label="Conversation with Sage">
            {isEmpty && (
              <div className="sage-empty-state">
                <span className="sage-empty-kicker">A conversation, not a questionnaire</span>
                <h2>Hey — I’m Sage.</h2>
                <p>Let’s figure out what kind of place would feel like yours.</p>
                <div className="sage-mobile-knows">
                  <WhatSageKnows compact />
                </div>
                <div className="sage-action-grid">
                  {ACTION_TILES.map(tile => (
                    <button
                      key={tile.message}
                      onClick={() => { if (!loading) sendMessage(tile.message) }}
                      className="sage-action-chip"
                    >
                      <span className="sage-action-icon" style={{ background: tile.bg }}>
                        <tile.Icon size={17} aria-hidden="true" />
                      </span>
                      <span>{tile.label}</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {initializing && <div className="sage-initializing">Picking up where you left off...</div>}

            {visibleMessages.map((msg) => {
              const assistantText = msg.role === 'assistant' ? msg.content.trim() : ''
              return (
                <div key={msg.id} className="sage-message-row">
                  {msg.role === 'user' ? (
                    <div className="sage-user-wrap">
                      <div className="sage-user-message">{msg.content}</div>
                    </div>
                  ) : (
                    <>
                      {assistantText && (
                        <div className="sage-assistant-wrap">
                          <SageOrb size={30} />
                          <div className="sage-assistant-content">
                            <div className="sage-message-label">Sage</div>
                            <div className="sage-assistant-message">{assistantText}</div>
                          </div>
                        </div>
                      )}
                      {msg.metadata?.schoolIds && msg.metadata.schoolIds.length > 0 && (
                        <div className="sage-school-stack">
                          {msg.metadata.schoolIds.map(id => <SchoolCard key={id} collegeId={id} />)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="sage-assistant-wrap sage-message-row" role="status" aria-label="Sage is responding">
                <SageOrb size={30} />
                <div>
                  <div className="sage-message-label">Sage</div>
                  <div className="sage-assistant-message"><TypingDots /></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="sage-composer-dock">
          {!user && visibleMessages.length >= 4 && (
            <div className="sage-save-nudge">
              <span>Save this conversation so you can come back to it</span>
              <button onClick={() => setShowAuthModal(true)}>Save it</button>
            </div>
          )}
          {vibeContext && (
            <div className="sage-vibe-context">
              <span className="pill">
                Discussing: {vibeContext.collegeName} Vibe Check · {vibeContext.fitScore}
                <button type="button" onClick={() => setVibeContext(null)} aria-label="Stop discussing this Vibe Check">×</button>
              </span>
            </div>
          )}
          <div className="sage-composer">
            <textarea
              ref={textareaRef}
              aria-label="Message Sage"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder={placeholder}
              rows={1}
              disabled={loading}
            />
            <button onClick={handleSend} disabled={!input.trim() || loading} aria-label="Send message">
              <ArrowRight size={17} />
            </button>
          </div>
          <p className="sage-ai-note">Sage is AI and can get details wrong. Check important facts with official sources. <Link to="/data-and-privacy">Learn how Admyt uses data.</Link></p>
        </div>
      </section>

      <aside className="sage-knowledge-satellite">
        <WhatSageKnows />
      </aside>

      {showAuthModal && (
        <AuthModal trigger="general" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}
