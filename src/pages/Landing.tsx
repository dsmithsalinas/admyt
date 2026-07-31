import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SageOrb from '@/components/sage/SageOrb'
import campusHorizon from '@/assets/landing/campus-horizon.webp'
import humanSage01 from '@/assets/sage/human-sage-01.webp'
import humanSage02 from '@/assets/sage/human-sage-02.webp'
import humanSage03 from '@/assets/sage/human-sage-03.webp'
import humanSage04 from '@/assets/sage/human-sage-04.webp'
import humanSage05 from '@/assets/sage/human-sage-05.webp'
import humanSage06 from '@/assets/sage/human-sage-06.webp'
import humanSage07 from '@/assets/sage/human-sage-07.webp'
import humanSage08 from '@/assets/sage/human-sage-08.webp'
import { useSageTransition } from '@/context/SageTransitionContext'

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
      className="landing-primary-cta"
      style={{
        background: 'linear-gradient(110deg, #4748f2 0%, #8057f4 52%, #e552ae 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '999px',
        padding: large ? '15px 25px' : '12px 22px',
        fontSize: large ? '15px' : '14px',
        fontWeight: 720,
        cursor: 'pointer',
        boxShadow: '0 15px 36px rgba(99,72,232,.32), 0 0 36px rgba(229,82,174,.13)',
        fontFamily: 'Inter, sans-serif',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 20px 44px rgba(99,72,232,.4), 0 0 42px rgba(229,82,174,.18)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 15px 36px rgba(99,72,232,.32), 0 0 36px rgba(229,82,174,.13)'
      }}
    >
      Start chatting with Sage
      <ArrowRight size={18} />
    </button>
  )
}

const humanSageAvatars = [
  humanSage01, humanSage02, humanSage03, humanSage04,
  humanSage05, humanSage06, humanSage07, humanSage08,
]

export default function Landing() {
  const navigate = useNavigate()
  const { startSageTransition } = useSageTransition()
  const pageRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const goToChat = () => startSageTransition(orbRef.current, navigate)

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

  return (
    <div ref={pageRef} className="premium-landing" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--admyt-slate)', background: 'var(--admyt-paper)', overflowX: 'hidden' }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="landing-nav premium-landing-nav">
        <a className="premium-wordmark" href="#" aria-label="Admyt home">
          <span>adm<GradText>y</GradText>t</span>
        </a>
        <div className="premium-landing-links">
          <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</a>
          <a href="#vibe" style={{ color: 'inherit', textDecoration: 'none' }}>Vibe Check</a>
          <a href="#trust" style={{ color: 'inherit', textDecoration: 'none' }}>Why trust it</a>
        </div>
      </nav>

      {/* ── Section 1: Hero ──────────────────────────────────── */}
      <section className="landing-hero premium-landing-hero">
        <div className="premium-hero-glow premium-hero-glow-one" aria-hidden="true" />
        <div className="premium-hero-glow premium-hero-glow-two" aria-hidden="true" />
        <div className="landing-hero-text premium-hero-copy">
          <div className="premium-hero-eyebrow">
            <span className="premium-hero-signal" />
            The y is for you
          </div>
          <h1 className="landing-hero-title premium-hero-title">
            Find where you fit.
          </h1>
          <p className="premium-hero-subtitle">
            Sage helps you discover colleges that fit the person you are — and the life you want.
          </p>
          <div className="landing-hero-cta-row">
            <CTAButton onClick={goToChat} large />
          </div>
        </div>

        <div className="premium-hero-scene" aria-label="A college campus opening into an energetic city">
          <img src={campusHorizon} alt="" aria-hidden="true" />
          <div className="premium-scene-orbit premium-scene-orbit-one" aria-hidden="true" />
          <div className="premium-scene-orbit premium-scene-orbit-two" aria-hidden="true" />
          <div ref={orbRef} className="premium-hero-orb">
            <SageOrb size={112} animate />
          </div>
          <div className="premium-hero-prompt">
            What would make a place feel like yours?
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

    </div>
  )
}
