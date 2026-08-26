import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SageOrb from '@/components/sage/SageOrb'
import campusHorizon from '@/assets/landing/campus-horizon.webp'
import sageCutout01 from '@/assets/sage/sage-cutout-01.webp'
import sageCutout02 from '@/assets/sage/sage-cutout-02.webp'
import sageCutout03 from '@/assets/sage/sage-cutout-03.webp'
import { useSageTransition } from '@/context/SageTransitionContext'

const GradText = ({ children }: { children: React.ReactNode }) => (
  <span className="premium-wordmark-y">{children}</span>
)

function CTAButton({ onClick, large }: { onClick: () => void; large?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`landing-primary-cta${large ? ' landing-primary-cta-large' : ''}`}
    >
      Start chatting with Sage
      <ArrowRight size={18} aria-hidden="true" />
    </button>
  )
}

function Eyebrow({ children, tone = 'indigo' }: { children: React.ReactNode; tone?: 'indigo' | 'violet' | 'teal' }) {
  return (
    <div className={`premium-story-eyebrow premium-story-eyebrow-${tone}`}>
      <span />
      {children}
    </div>
  )
}

function CampusWorld({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`premium-story-world ${className}`}>
      <img src={campusHorizon} alt="" aria-hidden="true" />
      <div className="premium-world-ring premium-world-ring-one" aria-hidden="true" />
      <div className="premium-world-ring premium-world-ring-two" aria-hidden="true" />
      {children}
    </div>
  )
}

const preferenceSignals = [
  'Small classes',
  'Creative campus',
  'Strong financial aid',
  'Somewhere outdoorsy',
  'Not too far from home',
  'Creative, not overwhelming',
]

export default function Landing() {
  const navigate = useNavigate()
  const { startSageTransition } = useSageTransition()
  const [activeScene, setActiveScene] = useState(0)
  const pageRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const goToChat = () => startSageTransition(orbRef.current, navigate)

  useEffect(() => {
    const makeVisible = (el: Element) => el.classList.add('visible')
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            makeVisible(entry.target)
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )

    const sceneObserver = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveScene(Number((visible.target as HTMLElement).dataset.premiumScene))
      },
      { threshold: [0.35, 0.55, 0.75], rootMargin: '-18% 0px -18% 0px' }
    )

    document.querySelectorAll('.premium-reveal:not(.visible)').forEach(el => revealObserver.observe(el))
    document.querySelectorAll('[data-premium-scene]').forEach(el => sceneObserver.observe(el))
    const fallback = window.setTimeout(() => {
      document.querySelectorAll('.premium-reveal:not(.visible)').forEach(makeVisible)
    }, 1800)

    return () => {
      revealObserver.disconnect()
      sceneObserver.disconnect()
      window.clearTimeout(fallback)
    }
  }, [])

  return (
    <div ref={pageRef} className="premium-landing">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <nav className="landing-nav premium-landing-nav" aria-label="Primary navigation">
        <a className="premium-wordmark" href="#" aria-label="Admyt home">
          adm<GradText>y</GradText>t
        </a>
        <div className="premium-landing-links">
          <a href="#how-it-works">How it works</a>
          <a href="#vibe">Vibe Check</a>
          <a href="#trust">Why trust it</a>
        </div>
      </nav>

      <main id="main-content" tabIndex={-1}>
        <section className={`premium-scroll-story${activeScene === 5 ? ' is-vibe' : ''}`}>
          <div className="premium-scroll-grid">
            <div className="premium-scroll-copy-column">
              <article className={`premium-scroll-panel premium-scroll-hero${activeScene === 0 ? ' is-active' : ''}`} data-premium-scene="0">
                <div>
                  <Eyebrow tone="teal">The y is for you</Eyebrow>
                  <h1 className="premium-hero-title">Find where you fit.</h1>
                  <p>Sage helps you discover colleges that fit the person you are — and the life you want.</p>
                  <CTAButton onClick={goToChat} large />
                </div>
              </article>

              <article className={`premium-scroll-panel premium-scroll-pressure${activeScene === 1 ? ' is-active' : ''}`} data-premium-scene="1">
                <div>
                  <p className="premium-story-ghost">Find where you fit.</p>
                  <h2>The college search became a numbers game.</h2>
                  <p>A GPA. A ranking. A list of schools everyone else thinks you should want.</p>
                  <div className="premium-pressure-cta"><CTAButton onClick={goToChat} /></div>
                </div>
              </article>

              <article className={`premium-scroll-panel${activeScene === 2 ? ' is-active' : ''}`} data-premium-scene="2">
                <div>
                  <Eyebrow>Meet Sage</Eyebrow>
                  <h2>Like having a friend who already figured it out.</h2>
                  <p>Ask the real questions. Sage helps you understand what matters to you — then find the places that match.</p>
                </div>
              </article>

              <article id="how-it-works" className={`premium-scroll-panel${activeScene === 3 ? ' is-active' : ''}`} data-premium-scene="3">
                <div>
                  <Eyebrow>How Admyt works</Eyebrow>
                  <h2>Start with what matters to you.</h2>
                  <p>Talk to Sage like a person. Your goals, your budget, and the kind of place that would feel like home start becoming a clearer picture.</p>
                </div>
              </article>

              <article className={`premium-scroll-panel${activeScene === 4 ? ' is-active' : ''}`} data-premium-scene="4">
                <div>
                  <Eyebrow>Your matches</Eyebrow>
                  <h2>Discover schools that fit your life.</h2>
                  <p>Sage connects what you care about to real colleges — including places you might never have found on someone else’s list.</p>
                  <div className="premium-inline-sage">
                    <SageOrb size={64} />
                    <span>This one checks more of your boxes than you might expect.</span>
                  </div>
                </div>
              </article>

              <article id="vibe" className={`premium-scroll-panel premium-scroll-vibe${activeScene === 5 ? ' is-active' : ''}`} data-premium-scene="5">
                <div>
                  <Eyebrow tone="violet">Vibe Check</Eyebrow>
                  <h2>Would you actually vibe there?</h2>
                  <p>A school can look perfect on paper and feel completely wrong in person. Sage gives you the honest read before you commit four years of your life.</p>
                </div>
              </article>
            </div>

            <div className="premium-scroll-visual-column" aria-hidden="true">
              <div className="premium-scroll-visual-sticky">
                <CampusWorld className={`premium-scroll-world${activeScene === 1 ? ' is-muted' : ''}`}>
                  <div className={`premium-scene-layer${activeScene === 0 ? ' is-active' : ''}`}>
                    <div className="premium-hero-prompt">What would make a place feel like yours?</div>
                  </div>

                  <div className={`premium-scene-layer${activeScene === 1 ? ' is-active' : ''}`}>
                    <div className="premium-pressure-pill premium-pressure-one">#42</div>
                    <div className="premium-pressure-pill premium-pressure-two">Most selective</div>
                    <div className="premium-pressure-pill premium-pressure-three">Reach</div>
                    <div className="premium-pressure-pill premium-pressure-four">Acceptance rate</div>
                    <div className="premium-pressure-pill premium-pressure-five">Everyone says I should apply</div>
                  </div>

                  <div className={`premium-scene-layer${activeScene === 2 ? ' is-active' : ''}`}>
                    <div className="premium-question-pill premium-question-one">Will I be lonely there?</div>
                    <div className="premium-question-pill premium-question-two">Can I actually afford it?</div>
                    <div className="premium-question-pill premium-question-three">What’s it really like?</div>
                    <div className="premium-sage-bubble">You can ask me the real questions.</div>
                  </div>

                  <div className={`premium-scene-layer${activeScene === 3 ? ' is-active' : ''}`}>
                    <div className="premium-signal-map">
                      {preferenceSignals.map((signal, index) => (
                        <div className={`premium-signal-pill premium-signal-pill-${index + 1}`} key={signal}>
                          <span />
                          {signal}
                        </div>
                      ))}
                      <div className="premium-sage-bubble premium-map-bubble">Okay. That gives me somewhere real to start.</div>
                    </div>
                  </div>

                  <div className={`premium-scene-layer${activeScene === 4 ? ' is-active' : ''}`}>
                    <div className="premium-match-signals">
                      {preferenceSignals.slice(0, 4).map(signal => <span key={signal}>{signal}</span>)}
                    </div>
                    <article className="premium-match-card">
                      <div className="premium-match-monogram">L&amp;C</div>
                      <div>
                        <h3>Lewis &amp; Clark College</h3>
                        <p>Portland, OR · liberal arts · strong aid profile</p>
                      </div>
                      <strong>91% <small>fit</small></strong>
                      <p className="premium-match-why">Small classes, a creative culture, and the outdoors are part of everyday life.</p>
                    </article>
                  </div>

                  <div className={`premium-scene-layer${activeScene === 5 ? ' is-active' : ''}`}>
                    <div className="premium-vibe-score premium-vibe-score-one"><span>Creative energy</span><strong>9/10</strong></div>
                    <div className="premium-vibe-score premium-vibe-score-two"><span>Finding your people</span><strong>8/10</strong></div>
                    <div className="premium-vibe-score premium-vibe-score-three"><span>Traditional school spirit</span><strong>4/10</strong></div>
                    <div className="premium-vibe-read">
                      <strong>Real talk:</strong> the creative culture fits. The traditional school-spirit side may feel quieter than you expect.
                    </div>
                  </div>

                  <div ref={orbRef} className={`premium-scroll-orb premium-scroll-orb-scene-${activeScene}`}>
                    <SageOrb size={112} animate />
                  </div>
                </CampusWorld>
              </div>
            </div>
          </div>
        </section>

        <section id="trust" className="premium-story-trust" aria-labelledby="trust-title">
          <div className="premium-reveal">
            <Eyebrow>What we stand for</Eyebrow>
            <h2 id="trust-title">The right school is<br />the one where you’ll thrive.</h2>
            <p>Not the one that scores highest on someone else’s list.</p>
          </div>
          <div className="premium-trust-grid">
            {[
              ['Fit beats rank', 'The right place matters more than the famous name.'],
              ['Everyone deserves a guide', 'Great guidance shouldn’t cost thousands.'],
              ['Affordability is part of fit', 'A school you can’t afford isn’t a fit.'],
              ['Only on your side', 'No sponsored schools. No selling your data.'],
            ].map(([title, body], index) => (
              <article className={`premium-trust-value premium-reveal premium-trust-value-${index + 1}`} key={title}>
                <span />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div className="premium-trust-orb premium-reveal"><SageOrb size={78} /></div>
        </section>

        <section className="premium-story-audience" aria-labelledby="audience-title">
          <div className="premium-story-copy premium-reveal">
            <Eyebrow>Built for you</Eyebrow>
            <h2 id="audience-title">Especially if no one’s helped before.</h2>
            <p>Maybe you’re the first in your family to do this. Maybe you’re buried in everyone else’s expectations. Maybe you just need somewhere honest to begin.</p>
            <strong>Whoever you are, Sage starts with you.</strong>
          </div>
          <div className="premium-portrait-constellation premium-reveal" aria-label="Students Sage is built to support">
            <div className="premium-portrait premium-portrait-one"><img src={sageCutout01} alt="" aria-hidden="true" /></div>
            <div className="premium-portrait premium-portrait-two"><img src={sageCutout02} alt="" aria-hidden="true" /></div>
            <div className="premium-portrait premium-portrait-three"><img src={sageCutout03} alt="" aria-hidden="true" /></div>
            <span className="premium-portrait-label premium-portrait-label-one">First-gen?</span>
            <span className="premium-portrait-label premium-portrait-label-two">Feeling overwhelmed?</span>
            <span className="premium-portrait-label premium-portrait-label-three">Not sure where to start?</span>
            <div className="premium-portrait-orb"><SageOrb size={74} animate /></div>
          </div>
        </section>

        <section className="premium-story-final" aria-labelledby="final-title">
          <div className="premium-final-orb premium-reveal"><SageOrb size={124} animate /></div>
          <div className="premium-reveal">
            <Eyebrow>The y is for you</Eyebrow>
            <h2 id="final-title">Your future starts<br />with a conversation.</h2>
            <p>No forms. No pressure. Just an honest place to begin.</p>
            <CTAButton onClick={goToChat} large />
          </div>
        </section>
      </main>

      <footer className="premium-landing-footer">
        <a className="premium-wordmark" href="#" aria-label="Admyt home">adm<GradText>y</GradText>t</a>
        <span>Find where you fit.</span>
        <nav className="landing-legal-links" aria-label="Legal and privacy">
          <Link to="/data-and-privacy">Data & privacy</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </footer>
    </div>
  )
}
