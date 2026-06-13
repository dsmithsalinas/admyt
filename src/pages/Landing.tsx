import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SageOrb from '@/components/sage/SageOrb'
import { useFadeUp } from '@/hooks/useFadeUp'

const GradText = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }}>
    {children}
  </span>
)

const GradTextPink = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6 60%, #EC4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }}>
    {children}
  </span>
)

function CTAButton({ onClick, large }: { onClick: () => void; large?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        color: 'white',
        border: 'none',
        borderRadius: large ? '24px' : '20px',
        padding: large ? '14px 28px' : '12px 24px',
        fontSize: large ? '15px' : '14px',
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(99,102,241,0.25)',
        fontFamily: 'Inter, sans-serif',
        transition: 'opacity 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '0.9'
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.25)'
      }}
    >
      Start chatting with Sage
    </button>
  )
}

function VibeBar({ label, score, delay }: { label: string; score: number; delay: string }) {
  const ref = useFadeUp()
  return (
    <div ref={ref} className={`fade-up`} style={{ transitionDelay: delay, background: 'white', borderRadius: '14px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#6366F1' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#6366F1' }}>{score}/10</span>
      </div>
      <div style={{ height: '6px', background: '#F4F3FE', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          width: `${score * 10}%`, height: '100%',
          background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
          borderRadius: '3px',
        }} />
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const goToChat = () => navigate('/chat')

  // Hero orb scale-in
  const orbRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = orbRef.current
    if (!el) return
    el.style.transform = 'scale(0.8)'
    el.style.opacity = '0'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.6s ease, opacity 0.5s ease'
        el.style.transform = 'scale(1)'
        el.style.opacity = '1'
      })
    })
  }, [])

  // Hero text fade-in
  const heroTextRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = heroTextRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    setTimeout(() => {
      el.style.transition = 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, 50)
  }, [])

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  const s2Ref = useFadeUp()
  const s3HeadRef = useFadeUp()
  const s3BodyRef = useFadeUp()
  const s4Ref = useFadeUp()
  const s5Ref = useFadeUp()
  const s6Ref = useFadeUp()
  const s7Ref = useFadeUp()
  const s7BodyRef = useFadeUp()
  const s8ctaRef = useFadeUp()
  const chatPreviewRef = useFadeUp()

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#3A3A4D', background: '#FCFCFF', overflowX: 'hidden' }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid #F0EEFB',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '17px', fontWeight: 500, color: '#15151C', letterSpacing: '-0.2px' }}>
          adm<GradText>y</GradText>t
        </span>
        <button
          onClick={goToChat}
          style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: 'white', border: 'none',
            borderRadius: '20px', padding: '8px 18px',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
          className="landing-nav-cta"
        >
          Start chatting with Sage
        </button>
      </nav>

      {/* ── Section 1: Hero ──────────────────────────────────── */}
      <section style={{ padding: '80px 20px 60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div ref={orbRef} style={{ marginBottom: '28px', display: 'inline-flex' }}>
          <div style={{ boxShadow: '0 0 60px rgba(99,102,241,0.25)', borderRadius: '50%' }}>
            <SageOrb size={80} />
          </div>
        </div>

        <div ref={heroTextRef}>
          <div style={{
            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '16px', fontWeight: 500,
          }}>
            the y is for you
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 500, color: '#15151C',
            letterSpacing: '-0.8px', margin: '0 0 20px',
            lineHeight: 1.1,
          }}>
            Find where you <GradTextPink>fit.</GradTextPink>
          </h1>

          <p style={{
            fontSize: '17px', color: '#8B8B9E', lineHeight: 1.65,
            maxWidth: '520px', margin: '0 auto 32px',
          }}>
            College isn't about the rankings. It's about finding the place where you'll actually thrive. Admyt helps you discover schools that match who you are — not just your GPA.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <CTAButton onClick={goToChat} large />
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: '#8B8B9E', fontFamily: 'Inter, sans-serif', padding: 0,
              }}
            >
              See how it works →
            </button>
          </div>
        </div>

        {/* Chat preview mockup */}
        <div ref={chatPreviewRef} className={`fade-up${mounted ? ' visible' : ''} landing-chat-preview`} style={{
          marginTop: '52px',
          width: '100%', maxWidth: '480px',
          border: '1px solid #EEECFB',
          borderRadius: '22px',
          boxShadow: '0 8px 40px rgba(99,102,241,0.08)',
          background: 'white',
          overflow: 'hidden',
        }}>
          {/* Chat messages */}
          <div style={{ padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Sage bubble */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <SageOrb size={28} />
              <div style={{
                background: '#F4F3FE', borderRadius: '0 14px 14px 14px',
                padding: '10px 14px', fontSize: '13px', color: '#3A3A4D', lineHeight: 1.55,
                maxWidth: '80%',
              }}>
                Hey, I'm Sage 👋 Tell me what you're looking for in a college — or just that you have no idea. Both are totally fine.
              </div>
            </div>
            {/* User bubble */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                borderRadius: '14px 14px 0 14px',
                padding: '10px 14px', fontSize: '13px', color: 'white', lineHeight: 1.55,
                maxWidth: '80%',
              }}>
                Honestly? I have no idea where to start.
              </div>
            </div>
            {/* Sage bubble */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <SageOrb size={28} />
              <div style={{
                background: '#F4F3FE', borderRadius: '0 14px 14px 14px',
                padding: '10px 14px', fontSize: '13px', color: '#3A3A4D', lineHeight: 1.55,
                maxWidth: '80%',
              }}>
                Perfect starting point. Let's figure it out together.
              </div>
            </div>
          </div>
          {/* Input bar */}
          <div style={{
            borderTop: '1px solid #F0EEFB', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              flex: 1, background: '#F8F8FC', border: '1px solid #EEECFB', borderRadius: '12px',
              padding: '9px 14px', fontSize: '13px', color: '#A8A8BC',
            }}>
              Ask me anything...
            </div>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: The problem ───────────────────────────── */}
      <section style={{ padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: '640px', width: '100%' }}>
          <div ref={s2Ref} className="fade-up">
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 500, color: '#15151C', marginBottom: '28px', letterSpacing: '-0.3px' }}>
              The college search is broken.
            </h2>
          </div>
          <div ref={s3HeadRef} className="fade-up fade-up-delay-1" style={{ fontSize: '16px', color: '#3A3A4D', lineHeight: 1.75 }}>
            <p style={{ marginBottom: '16px' }}>
              Somewhere along the way, finding a college stopped being exciting and started being terrifying.
            </p>
            <p style={{ marginBottom: '16px' }}>
              It became a numbers game. A GPA. A test score. A ranking in a magazine. A list of "reach, target, safety" schools from a counselor with four hundred other students. A dinner-table debate about which name will look best.
            </p>
            <p style={{ marginBottom: '0' }}>
              And underneath all of it, the one question almost nobody asks you:
            </p>
            <p style={{ marginTop: '20px', marginBottom: '0', fontSize: '18px', fontWeight: 500 }}>
              <GradTextPink>Where would you actually be happy?</GradTextPink>
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3: Meet Sage ─────────────────────────────── */}
      <section style={{ background: '#F8F7FF', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: '680px', width: '100%' }}>
          <div ref={s3BodyRef} className="fade-up">
            <div style={{
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: '12px', fontWeight: 500,
            }}>
              meet sage
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 500, color: '#15151C', marginBottom: '20px', letterSpacing: '-0.3px' }}>
              Like having a friend who already figured it out.
            </h2>
            <p style={{ fontSize: '16px', color: '#3A3A4D', lineHeight: 1.75, marginBottom: '28px' }}>
              Sage is the senior who's been through the whole confusing process, learned from it, and genuinely wants you to get it right. The older sibling you wish you had.
            </p>
            <p style={{ fontSize: '16px', color: '#3A3A4D', lineHeight: 1.75, marginBottom: '24px' }}>
              You can ask Sage the real questions — the ones that feel too small or too honest to ask anyone else:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginBottom: '32px' }}>
            {[
              'Will I be lonely there?',
              'Do people like me actually go here?',
              'Is everyone going to be richer than me?',
              "What's it really like?",
            ].map((q, i) => (
              <div
                key={q}
                className={`fade-up fade-up-delay-${i + 1}`}
                style={{
                  background: 'white', border: '1px solid #EEECFB', borderRadius: '14px',
                  padding: '12px 16px', fontStyle: 'italic', color: '#3A3A4D', fontSize: '14px',
                  lineHeight: 1.5,
                }}
              >
                {q}
              </div>
            ))}
          </div>

          <div className="fade-up fade-up-delay-4">
            <p style={{ fontSize: '16px', color: '#3A3A4D', lineHeight: 1.75, marginBottom: '24px' }}>
              Sage doesn't push. Sage doesn't hype the famous schools. Sage helps you understand yourself first — then helps you find the places that match.
            </p>
            <CTAButton onClick={goToChat} />
          </div>
        </div>
      </section>

      {/* ── Section 4: How it works ──────────────────────────── */}
      <section id="how-it-works" style={{ padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: '680px', width: '100%' }}>
          <div ref={s4Ref} className="fade-up">
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 500, color: '#15151C', marginBottom: '40px', letterSpacing: '-0.3px' }}>
              How Admyt works
            </h2>
          </div>

          <div style={{ position: 'relative' }}>
            {[
              {
                title: "Just start talking.",
                body: "No forms, no logins, no SAT score required. Tell Sage what you're thinking — or that you have no idea where to start. Both are totally fine.",
              },
              {
                title: "Sage gets to know you.",
                body: "Through a real conversation, Sage learns what actually matters to you — your goals, your budget, the kind of place you'd feel at home. Not just your stats.",
              },
              {
                title: "Discover schools that fit.",
                body: "Sage surfaces colleges matched to you — including ones you've never heard of that might fit better (and cost less) than the names everyone talks about.",
              },
              {
                title: "Run a Vibe Check.",
                body: "Before you fall in love with a school, see what it's really like. Vibe Check breaks down the social scene, culture, and campus life — honestly — so you know if you'd actually thrive there.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className={`fade-up fade-up-delay-${i + 1}`}
                style={{ display: 'flex', gap: '20px', marginBottom: i < 3 ? '32px' : '0', position: 'relative' }}
              >
                {/* Number circle + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '14px', fontWeight: 500, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  {i < 3 && (
                    <div style={{
                      width: '2px', flex: 1, minHeight: '32px', marginTop: '6px',
                      background: 'linear-gradient(180deg, #6366F1, #8B5CF6)',
                      opacity: 0.3,
                    }} />
                  )}
                </div>
                <div style={{ paddingTop: '6px', paddingBottom: i < 3 ? '0' : '0' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: '#15151C', marginBottom: '6px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#8B8B9E', lineHeight: 1.65 }}>
                    {step.body}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '40px' }} className="fade-up fade-up-delay-4">
            <CTAButton onClick={goToChat} large />
          </div>
        </div>
      </section>

      {/* ── Section 5: Vibe Check spotlight ─────────────────── */}
      <section style={{
        background: 'linear-gradient(150deg, #6366F1, #8B5CF6 60%, #EC4899)',
        padding: '80px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div ref={s5Ref} className="fade-up" style={{ maxWidth: '680px', width: '100%' }}>
          <div style={{
            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.85)', marginBottom: '12px', fontWeight: 500,
          }}>
            ✨ vibe check
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 500, color: 'white', marginBottom: '20px', letterSpacing: '-0.3px' }}>
            Would you actually vibe there?
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.75, marginBottom: '16px' }}>
            A school can look perfect on paper and feel completely wrong in person. Vibe Check is how you find out before you apply.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.75, marginBottom: '16px' }}>
            Pick what matters to you — social scene, creativity, diversity, the outdoors, school spirit, whatever — and Sage gives you the real read on campus culture. Not the brochure version. The honest one.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.75, marginBottom: '36px' }}>
            Because fit isn't a number. It's a feeling. And you deserve to know it before you commit four years of your life.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <VibeBar label="Social scene" score={7} delay="0.1s" />
            <VibeBar label="Arts & creativity" score={8} delay="0.2s" />
            <VibeBar label="Outdoor access" score={6} delay="0.3s" />
          </div>
        </div>
      </section>

      {/* ── Section 6: What we stand for ────────────────────── */}
      <section style={{ padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: '680px', width: '100%' }}>
          <div ref={s6Ref} className="fade-up">
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 500, color: '#15151C', marginBottom: '36px', letterSpacing: '-0.3px' }}>
              What we stand for
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              {
                emoji: "🎯",
                title: "Fit beats rank.",
                body: "The right school is the one where you'll thrive — not the one that scores highest on someone else's list.",
                delay: "0.1s",
              },
              {
                emoji: "🤝",
                title: "Everyone deserves a guide.",
                body: "Great college guidance shouldn't cost thousands or depend on which counselor you got. Admyt is free, for anyone, from the first question.",
                delay: "0.2s",
              },
              {
                emoji: "🗺️",
                title: "There are more options than you've been told.",
                body: "We'll introduce you to schools you've never heard of — including ones that fit you better and cost a lot less.",
                delay: "0.3s",
              },
              {
                emoji: "🛡️",
                title: "We're on your side. Only yours.",
                body: "We'll never sell your data. We'll never take money to promote schools. Every recommendation is about your fit — nothing else.",
                delay: "0.4s",
              },
            ].map(card => (
              <div
                key={card.title}
                className="fade-up"
                style={{
                  background: 'white', border: '1px solid #EEECFB', borderRadius: '18px',
                  padding: '20px', boxShadow: '0 3px 16px rgba(99,102,241,0.06)',
                  borderTop: '3px solid transparent',
                  backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #6366F1, #8B5CF6)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  transitionDelay: card.delay,
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F4F3FE, #EDE9FE)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', marginBottom: '12px',
                }}>
                  {card.emoji}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#15151C', marginBottom: '8px' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '13px', color: '#8B8B9E', lineHeight: 1.65 }}>
                  {card.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: Who it's for ──────────────────────────── */}
      <section style={{ background: '#F8F7FF', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          <div ref={s7Ref} className="fade-up">
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 500, color: '#15151C', marginBottom: '24px', letterSpacing: '-0.3px' }}>
              Built for you — especially if no one's helped before.
            </h2>
          </div>
          <div ref={s7BodyRef} className="fade-up fade-up-delay-1">
            <p style={{ fontSize: '16px', color: '#3A3A4D', lineHeight: 1.8, marginBottom: '20px' }}>
              Maybe you're the first in your family to do this, with no roadmap and no one to ask. Maybe you're drowning in everyone else's expectations and just want someone to ask what <em>you</em> want. Maybe you test fine but don't see yourself in the glossy brochures. Maybe you just need a school you can actually afford.
            </p>
            <p style={{ fontSize: '16px', fontWeight: 500 }}>
              <GradTextPink>Whoever you are — Admyt is a place to begin.</GradTextPink>
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 8: Final CTA ─────────────────────────────── */}
      <section style={{ padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', width: '100%' }}>
          <div ref={s8ctaRef} className="fade-up">
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 500, color: '#15151C',
              letterSpacing: '-0.5px', marginBottom: '16px',
            }}>
              Your future starts with a conversation.
            </h2>
            <p style={{ fontSize: '16px', color: '#8B8B9E', lineHeight: 1.65, marginBottom: '32px' }}>
              No forms. No pressure. No cost. Just an honest conversation about where you actually belong.
            </p>
            <CTAButton onClick={goToChat} large />
            <p style={{ fontSize: '12px', color: '#A8A8BC', marginTop: '10px' }}>
              Free forever · No account needed to start
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{
        background: 'white', borderTop: '1px solid #F0EEFB', padding: '32px 20px',
      }}>
        <div style={{
          maxWidth: '720px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: '20px',
        }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 500, color: '#15151C', letterSpacing: '-0.2px', marginBottom: '4px' }}>
              adm<GradText>y</GradText>t
            </div>
            <div style={{ fontSize: '12px', color: '#A8A8BC' }}>Find where you fit.</div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['About', 'Privacy', 'Contact'].map(link => (
              <a
                key={link}
                href="#"
                style={{ fontSize: '13px', color: '#A8A8BC', textDecoration: 'none' }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{
            fontSize: '11px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            fontWeight: 500,
          }}>
            The y is for you.
          </span>
        </div>
      </footer>

      {/* Nav CTA mobile hide */}
      <style>{`
        @media (max-width: 479px) {
          .landing-nav-cta { display: none !important; }
          .landing-chat-preview { display: none !important; }
        }
      `}</style>
    </div>
  )
}
