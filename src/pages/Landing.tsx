import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SageOrb from '@/components/sage/SageOrb'
import sageCutout01 from '@/assets/sage/sage-cutout-01.webp'
import sageCutout02 from '@/assets/sage/sage-cutout-02.webp'
import sageCutout03 from '@/assets/sage/sage-cutout-03.webp'
import sageCutout04 from '@/assets/sage/sage-cutout-04.webp'
import humanSage01 from '@/assets/sage/human-sage-01.webp'
import humanSage02 from '@/assets/sage/human-sage-02.webp'
import humanSage03 from '@/assets/sage/human-sage-03.webp'
import humanSage04 from '@/assets/sage/human-sage-04.webp'
import humanSage05 from '@/assets/sage/human-sage-05.webp'
import humanSage06 from '@/assets/sage/human-sage-06.webp'
import humanSage07 from '@/assets/sage/human-sage-07.webp'
import humanSage08 from '@/assets/sage/human-sage-08.webp'

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

function CTAButton({ onClick, large }: { onClick: () => void; large?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--admyt-grad)',
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

function SageHeroAnimation() {
  const cutouts = [
    { src: sageCutout01, delay: '0s' },
    { src: sageCutout02, delay: '.4s' },
    { src: sageCutout03, delay: '.2s' },
    { src: sageCutout04, delay: '.6s' },
  ]

  return (
    <div className="hero-visual" style={{
      gridColumn: '1 / -1',
      position: 'relative',
      minHeight: '188px',
      overflow: 'hidden',
      border: '1px solid var(--admyt-line)',
      borderRadius: '22px',
      background: 'radial-gradient(ellipse at center, rgba(99,102,241,.11), transparent 45%), rgba(255,255,255,.76)',
      boxShadow: '0 20px 58px rgba(46,37,111,.09)',
    }}>
      <div style={{ position: 'absolute', left: '8%', right: '8%', top: '50%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,.18), rgba(27,154,156,.18), transparent)' }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '188px', gap: 'clamp(14px, 4vw, 42px)' }}>
        {cutouts.slice(0, 2).map(cutout => (
          <img key={cutout.src} src={cutout.src} alt="" aria-hidden="true" className="sage-hero-cutout" style={{ width: 'clamp(76px, 9vw, 118px)', height: 'clamp(88px, 10vw, 132px)', objectFit: 'contain', filter: 'drop-shadow(0 16px 20px rgba(46,37,111,.15))', animationDelay: cutout.delay }} />
        ))}
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center', flex: '0 0 clamp(110px, 13vw, 154px)', width: 'clamp(110px, 13vw, 154px)', height: 'clamp(110px, 13vw, 154px)' }}>
          <div className="hero-pulse" />
          <div className="hero-pulse hero-pulse-two" />
          <div className="hero-pulse hero-pulse-three" />
          <SageOrb size={108} animate />
        </div>
        {cutouts.slice(2).map(cutout => (
          <img key={cutout.src} src={cutout.src} alt="" aria-hidden="true" className="sage-hero-cutout" style={{ width: 'clamp(76px, 9vw, 118px)', height: 'clamp(88px, 10vw, 132px)', objectFit: 'contain', filter: 'drop-shadow(0 16px 20px rgba(46,37,111,.15))', animationDelay: cutout.delay }} />
        ))}
      </div>
    </div>
  )
}

const humanSageAvatars = [
  humanSage01, humanSage02, humanSage03, humanSage04,
  humanSage05, humanSage06, humanSage07, humanSage08,
]

export default function Landing() {
  const navigate = useNavigate()
  const goToChat = () => navigate('/chat')
  const pageRef = useRef<HTMLDivElement>(null)

  // Single global observer — watches every .fade-up element on the page
  useEffect(() => {
    const makeVisible = (el: Element) => el.classList.add('visible')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            makeVisible(entry.target)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    )

    // Observe all current .fade-up elements
    const observe = () => {
      document.querySelectorAll('.fade-up:not(.visible)').forEach(el => observer.observe(el))
    }
    observe()

    // Fallback: force all visible after 1.5s in case observer never fires
    const fallback = setTimeout(() => {
      document.querySelectorAll('.fade-up:not(.visible)').forEach(makeVisible)
    }, 1500)

    return () => {
      observer.disconnect()
      clearTimeout(fallback)
    }
  }, [])

  // Hero orb scale-in on mount
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

  // Hero text fade-in on mount
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

  // Chat preview animates in shortly after mount (it's above the fold)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div ref={pageRef} style={{ fontFamily: 'Inter, sans-serif', color: 'var(--admyt-slate)', background: 'var(--admyt-paper)', overflowX: 'hidden' }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="landing-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,253,250,0.9)', borderBottom: '1px solid var(--admyt-line)', backdropFilter: 'blur(16px)',
        minHeight: '68px',
        padding: '0 34px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 650, color: 'var(--admyt-ink)', textDecoration: 'none' }} href="#">
          <SageOrb size={30} />
          <span>adm<GradText>y</GradText>t</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--admyt-muted)', fontSize: '14px' }}>
          <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</a>
          <a href="#vibe" style={{ color: 'inherit', textDecoration: 'none' }}>Vibe Check</a>
          <a href="#trust" style={{ color: 'inherit', textDecoration: 'none' }}>Why trust it</a>
          <button
            onClick={goToChat}
            style={{
              background: 'var(--admyt-grad)',
              color: 'white', border: 'none',
              borderRadius: '999px', padding: '0 22px',
              minHeight: 46,
              fontSize: '14px', fontWeight: 650, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 16px 34px rgba(96,76,223,.28)',
            }}
            className="landing-nav-cta"
          >
            Start chatting with Sage
          </button>
        </div>
      </nav>

      {/* ── Section 1: Hero ──────────────────────────────────── */}
      <section className="landing-hero" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .9fr) minmax(410px, 520px)', gap: '34px 46px', alignItems: 'center', alignContent: 'start', width: 'min(1180px, calc(100% - 48px))', minHeight: 'auto', margin: '0 auto', padding: '34px 0 64px' }}>

        <div ref={orbRef} style={{ gridColumn: '1 / -1' }}>
          <SageHeroAnimation />
        </div>

        <div ref={heroTextRef} style={{ textAlign: 'left' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            color: '#4b3dcc', fontSize: '12px', fontWeight: 760, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: '18px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--admyt-teal)', boxShadow: '0 0 0 6px rgba(27,154,156,.12)' }} />
            The y is for you
          </div>

          <h1 style={{
            fontSize: 'clamp(48px, 7vw, 78px)', fontWeight: 820, color: 'var(--admyt-ink)',
            letterSpacing: '-.04em', margin: '0 0 24px',
            lineHeight: .96,
          }}>
            Find where you fit.
          </h1>

          <p style={{
            fontSize: '20px', color: 'var(--admyt-muted)', lineHeight: 1.65,
            maxWidth: '500px', margin: '0 0 32px',
          }}>
            College isn't about the rankings. It's about finding the place where you'll actually thrive. Admyt helps you discover schools that match who you are — not just your GPA.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <CTAButton onClick={goToChat} large />
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: '#fff', border: '1px solid var(--admyt-line)', cursor: 'pointer',
                fontSize: '15px', color: '#4b3dcc', fontFamily: 'Inter, sans-serif', padding: '0 22px',
                minHeight: 46, borderRadius: 999, fontWeight: 650,
              }}
            >
              See how it works
            </button>
          </div>
        </div>

        {/* Chat preview mockup — fade in on mount since it's above the fold */}
        <div
          className={`fade-up${mounted ? ' visible' : ''} landing-chat-preview`}
          style={{ transitionDelay: '0.15s', marginTop: 0, width: '100%', border: '1px solid var(--admyt-line)', borderRadius: '20px', boxShadow: 'var(--admyt-shadow)', background: '#ffffff', overflow: 'hidden' }}
        >
          <div style={{ minHeight: 74, borderBottom: '1px solid var(--admyt-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SageOrb size={44} />
              <div>
                <strong style={{ display: 'block', color: 'var(--admyt-ink)' }}>Sage</strong>
                <span style={{ display: 'block', color: 'var(--admyt-muted)', fontSize: 13 }}>the older sibling you wish you had</span>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--admyt-muted)', fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--admyt-teal)', boxShadow: '0 0 0 6px rgba(27,154,156,.12)' }} />
              live preview
            </span>
          </div>
          <div style={{ padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <SageOrb size={28} />
              <div style={{ background: '#F4F3FE', borderRadius: '0 14px 14px 14px', padding: '10px 14px', fontSize: '13px', color: '#3A3A4D', lineHeight: 1.55, maxWidth: '80%' }}>
                Hey, I'm Sage 👋 Tell me what you're looking for in a college — or just that you have no idea. Both are totally fine.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: '14px 14px 0 14px', padding: '10px 14px', fontSize: '13px', color: 'white', lineHeight: 1.55, maxWidth: '80%' }}>
                Honestly? I have no idea where to start.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <SageOrb size={28} />
              <div style={{ background: '#F4F3FE', borderRadius: '0 14px 14px 14px', padding: '10px 14px', fontSize: '13px', color: '#3A3A4D', lineHeight: 1.55, maxWidth: '80%' }}>
                Perfect starting point. Let's figure it out together.
              </div>
            </div>
            <div style={{ border: '1px solid var(--admyt-line)', borderRadius: 16, padding: 16, boxShadow: 'var(--admyt-shadow-small)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--admyt-ink)', fontSize: 18 }}>Lewis & Clark College</strong>
                  <span style={{ color: 'var(--admyt-muted)', fontSize: 13 }}>Portland, OR · liberal arts · strong aid profile</span>
                </div>
                <span style={{ borderRadius: 999, background: 'rgba(27,154,156,.12)', color: '#087a70', padding: '7px 10px', fontWeight: 760, whiteSpace: 'nowrap' }}>91% fit</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                <div style={{ background: '#fbfaff', borderRadius: 10, padding: 10, color: 'var(--admyt-slate)', fontSize: 12 }}>Outdoors are part of the rhythm there, not just brochure scenery.</div>
                <div style={{ background: '#fbfaff', borderRadius: 10, padding: 10, color: 'var(--admyt-slate)', fontSize: 12 }}>Small classes could make it easier to find your people early.</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #F0EEFB', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, background: '#F8F8FC', border: '1px solid #EEECFB', borderRadius: '12px', padding: '9px 14px', fontSize: '13px', color: '#A8A8BC' }}>
              Ask me anything...
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-sage-scenes" id="meet-sage">
        <div className="landing-inner landing-sage-strip">
          <div className="fade-up">
            <div className="landing-eyebrow"><span className="landing-signal" />Meet Sage</div>
            <h2>One guide. A lot of ways to feel seen.</h2>
            <p className="landing-wide-copy">
              Sage is the calm voice in your corner — part older sibling, part friend who already figured it out. However you picture that person, the point is the same: you're not doing this alone.
            </p>
            <div className="landing-orb-note">
              <SageOrb size={54} />
              <p className="match-note">In chat, Sage stays simple: a calm little orb, ready when you are.</p>
            </div>
          </div>
          <div className="landing-avatar-rail" aria-label="Human Sage avatar set">
            {humanSageAvatars.map(src => (
              <div className="landing-human-avatar" key={src}>
                <img src={src} alt="Human Sage avatar portrait" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="how-it-works">
        <div className="landing-inner">
          <div className="landing-section-head fade-up">
            <div>
              <div className="landing-eyebrow"><span className="landing-signal" />How Admyt works</div>
              <h2>How Admyt works</h2>
            </div>
            <p>No forms, no pressure, no SAT score required. Start with a real conversation and let Sage help you sort the messy parts into a list that actually feels like yours.</p>
          </div>
          <div className="landing-panel">
            <div className="landing-journey">
              {[
                ['Just start talking', "Tell Sage what you're thinking — or that you have no idea where to start. Both are totally fine."],
                ['Sage gets to know you', "Sage learns what actually matters: your goals, your budget, and the kind of place you'd feel at home."],
                ['Discover schools that fit', "See schools matched to you, including ones you may not know yet that could fit better and cost less."],
                ['Run Vibe Check', 'Before you fall in love with a school, get the honest read on campus culture and daily life.'],
              ].map(([title, body], i) => (
                <article className="landing-step fade-up" key={title} style={{ transitionDelay: `${i * .08}s` }}>
                  <div className="landing-num">{i + 1}</div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-vibe-section" id="vibe">
        <div className="landing-inner landing-vibe-layout">
          <div className="fade-up">
            <div className="landing-eyebrow"><span className="landing-signal" />Vibe Check</div>
            <h2>Would you actually vibe there?</h2>
            <p className="landing-wide-copy">
              A school can look perfect on paper and feel completely wrong in person. Vibe Check helps you see the social scene, culture, and campus life before you commit four years of your life.
            </p>
            <div className="landing-voice-card">
              <div className="landing-human-avatar"><img src={humanSage03} alt="Human Sage avatar portrait" /></div>
              <p>Real talk belongs here. Not the brochure version — the version that helps you decide if you would actually feel at home.</p>
            </div>
          </div>
          <div className="landing-score-card fade-up" style={{ transitionDelay: '.12s' }}>
            <div className="landing-score-head">
              <span>Sample Vibe Check · Oberlin College</span>
              <h3>Creative, activist, and proudly unusual.</h3>
            </div>
            <div className="landing-meters">
              {[
                ['Creative energy', '9/10', '90%'],
                ['Traditional school spirit', '4/10', '40%'],
                ['Finding your people', '8/10', '80%'],
              ].map(([label, score, width]) => (
                <div className="landing-meter" key={label}>
                  <div className="landing-meter-top"><span>{label}</span><strong>{score}</strong></div>
                  <div className="bar"><span style={{ width }} /></div>
                </div>
              ))}
              <div className="landing-readout">
                Real talk: if you want a polished, rah-rah campus, this may feel too niche. If you want classmates who care intensely about art, politics, music, and identity, it could feel like permission to be yourself.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="trust">
        <div className="landing-inner">
          <div className="landing-section-head fade-up">
            <div>
              <div className="landing-eyebrow"><span className="landing-signal" />What we stand for</div>
              <h2>What we stand for</h2>
            </div>
            <p>The right school is the one where you'll thrive. Not the one that scores highest on someone else's list.</p>
          </div>
          <div className="landing-value-grid">
            {[
              ['Fit beats rank', "The right school is the one where you'll show up, plug in, and become yourself.", 'var(--admyt-indigo)'],
              ['Everyone deserves a guide', "Great college guidance shouldn't cost thousands or depend on which counselor you got.", 'var(--admyt-teal)'],
              ['Affordability is part of fit', "A school you can't afford isn't a fit, no matter how good it looks.", 'var(--admyt-coral)'],
              ['Only on your side', 'We never sell your data. We never take money to promote schools. No sponsored results, ever.', 'var(--admyt-gold)'],
            ].map(([title, body, color], i) => (
              <article className="landing-value fade-up" key={title} style={{ transitionDelay: `${i * .08}s` }}>
                <div className="dot" style={{ background: color }} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-audience">
        <div className="landing-inner landing-audience-layout">
          <div className="fade-up">
            <div className="landing-eyebrow"><span className="landing-signal" />Built for students</div>
            <h2>Built for you — especially if no one's helped before.</h2>
            <p className="landing-wide-copy">
              Maybe you're the first in your family to do this. Maybe you're drowning in everyone else's expectations. Maybe you just need a school you can actually afford. Whoever you are — Admyt is a place to begin.
            </p>
            <div className="landing-avatar-mini-row" aria-label="A few human Sage avatars">
              {[humanSage01, humanSage05, humanSage07].map(src => (
                <div className="landing-human-avatar" key={src}><img src={src} alt="Human Sage avatar portrait" /></div>
              ))}
            </div>
          </div>
          <div className="landing-quote-stack">
            <div className="landing-quote-card"><strong>First-gen?</strong> Sage explains the process without assuming you already know the rules.</div>
            <div className="landing-quote-card"><strong>Overwhelmed?</strong> Hey, take a breath. You do not have to figure it all out today.</div>
            <div className="landing-quote-card"><strong>Feeling pressured?</strong> Sage helps you separate what sounds impressive from what might actually make you happy.</div>
          </div>
        </div>
      </section>

      <section className="landing-final">
        <div className="landing-inner fade-up">
          <h2>Your future starts with a conversation.</h2>
          <p>No forms. No pressure. No cost. Just an honest conversation about where you actually belong.</p>
          <CTAButton onClick={goToChat} large />
          <p style={{ marginTop: 12, fontSize: 13 }}>Free forever · No account needed to start</p>
        </div>
      </section>

      <footer style={{ background: 'white', borderTop: '1px solid var(--admyt-line)', padding: '24px 0' }}>
        <div className="landing-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <a style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--admyt-ink)', textDecoration: 'none', fontWeight: 760 }} href="#">
            <SageOrb size={30} />
            <span>adm<GradText>y</GradText>t</span>
          </a>
          <div style={{ display: 'flex', gap: 20, color: 'var(--admyt-muted)', fontSize: 13 }}>
            <span>Find where you fit.</span>
            <span>The y is for you.</span>
          </div>
        </div>
      </footer>

      <style>{`
        .hero-pulse {
          position: absolute;
          inset: 4px;
          border: 2px solid rgba(99,102,241,.2);
          border-radius: 50%;
          animation: heroPulse 2.8s ease-out infinite;
        }
        .hero-pulse-two {
          border-color: rgba(27,154,156,.18);
          animation-delay: .7s;
        }
        .hero-pulse-three {
          border-color: rgba(240,171,252,.2);
          animation-delay: 1.4s;
        }
        @media (max-width: 479px) {
          .landing-nav-cta { display: none !important; }
          .landing-chat-preview { display: none !important; }
        }
        @media (max-width: 900px) {
          .landing-hero {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            width: min(100% - 32px, 720px) !important;
          }
        }
        @media (max-width: 720px) {
          .landing-sage-section { grid-template-columns: 1fr !important; }
          .landing-sage-section > img { order: 2; max-width: 240px !important; }
          .sage-hero-cutout { width: 68px !important; height: 68px !important; }
        }
        .sage-hero-cutout {
          animation: sageHeroFloat 5s ease-in-out infinite;
        }
        @keyframes sageHeroFloat {
          0%, 100% { margin-top: 0; }
          50% { margin-top: -8px; }
        }
        @keyframes heroPulse {
          0% { transform: scale(.82); opacity: .72; }
          100% { transform: scale(1.22); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
