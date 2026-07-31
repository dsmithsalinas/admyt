import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import type { NavigateFunction } from 'react-router-dom'
import SageOrb from '@/components/sage/SageOrb'

interface SageTransitionContextValue {
  isTransitioning: boolean
  destinationRef: RefObject<HTMLDivElement>
  startSageTransition: (source: HTMLElement | null, navigate: NavigateFunction) => void
}

const SageTransitionContext = createContext<SageTransitionContextValue | null>(null)

const TRAVEL_MS = 1280

export function SageTransitionProvider({ children }: { children: ReactNode }) {
  const destinationRef = useRef<HTMLDivElement>(null)
  const overlayOrbRef = useRef<HTMLDivElement>(null)
  const fallbackTimerRef = useRef<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null)

  const finishTransition = useCallback(() => {
    setIsTransitioning(false)
    setSourceRect(null)
    document.documentElement.classList.remove('sage-route-transitioning')
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  const startSageTransition = useCallback((source: HTMLElement | null, navigate: NavigateFunction) => {
    if (isTransitioning) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !source) {
      document.documentElement.classList.add('sage-route-transitioning')
      setIsTransitioning(true)
      navigate('/chat', { state: { fromLanding: true } })
      fallbackTimerRef.current = window.setTimeout(finishTransition, 220)
      return
    }

    setSourceRect(source.getBoundingClientRect())
    setIsTransitioning(true)
    document.documentElement.classList.add('sage-route-transitioning')

    // The fixed orb lives above both routes. Navigating now lets the chat room
    // assemble behind it while the same visible Sage identity keeps moving.
    window.requestAnimationFrame(() => navigate('/chat', { state: { fromLanding: true } }))
    fallbackTimerRef.current = window.setTimeout(finishTransition, TRAVEL_MS + 500)
  }, [finishTransition, isTransitioning])

  useEffect(() => {
    if (!isTransitioning || !sourceRect || !overlayOrbRef.current) return

    let cancelled = false
    let frame = 0

    const findDestinationAndAnimate = () => {
      if (cancelled) return
      const destination = destinationRef.current
      if (!destination && frame < 24) {
        frame += 1
        window.requestAnimationFrame(findDestinationAndAnimate)
        return
      }

      const destinationRect = destination?.getBoundingClientRect()
      const endLeft = destinationRect?.left ?? Math.max(24, window.innerWidth * 0.08)
      const endTop = destinationRect?.top ?? Math.max(120, window.innerHeight * 0.2)
      const endSize = destinationRect?.width ?? Math.min(112, window.innerWidth * 0.18)
      const startSize = sourceRect.width
      const curveX = Math.max(42, Math.min(window.innerWidth - endSize - 24, window.innerWidth * 0.48))
      const curveY = Math.max(42, Math.min(sourceRect.top - 54, window.innerHeight * 0.12))

      const animation = overlayOrbRef.current?.animate([
        {
          left: `${sourceRect.left}px`,
          top: `${sourceRect.top}px`,
          width: `${startSize}px`,
          height: `${startSize}px`,
          transform: 'translate3d(0, 0, 0) scale(1)',
        },
        {
          left: `${sourceRect.left + 10}px`,
          top: `${Math.max(28, sourceRect.top - 44)}px`,
          width: `${startSize * 1.04}px`,
          height: `${startSize * 1.04}px`,
          transform: 'translate3d(0, 0, 0) scale(1.02)',
          offset: 0.18,
        },
        {
          left: `${curveX}px`,
          top: `${curveY}px`,
          width: `${Math.max(startSize, endSize) * 1.08}px`,
          height: `${Math.max(startSize, endSize) * 1.08}px`,
          transform: 'translate3d(0, 0, 0) scale(1.05)',
          offset: 0.62,
        },
        {
          left: `${endLeft}px`,
          top: `${endTop}px`,
          width: `${endSize}px`,
          height: `${endSize}px`,
          transform: 'translate3d(0, 0, 0) scale(1)',
        },
      ], {
        duration: TRAVEL_MS,
        easing: 'cubic-bezier(.2,.72,.2,1)',
        fill: 'forwards',
      })

      animation?.addEventListener('finish', finishTransition, { once: true })
    }

    window.requestAnimationFrame(findDestinationAndAnimate)
    return () => { cancelled = true }
  }, [finishTransition, isTransitioning, sourceRect])

  useEffect(() => () => {
    if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current)
    document.documentElement.classList.remove('sage-route-transitioning')
  }, [])

  const value = useMemo(() => ({
    isTransitioning,
    destinationRef,
    startSageTransition,
  }), [isTransitioning, startSageTransition])

  return (
    <SageTransitionContext.Provider value={value}>
      {children}
      {isTransitioning && (
        <>
          <div className="sage-transition-veil" aria-hidden="true" />
          {sourceRect && (
            <div
              ref={overlayOrbRef}
              className="sage-transition-orb"
              style={{
                left: sourceRect.left,
                top: sourceRect.top,
                width: sourceRect.width,
                height: sourceRect.width,
              }}
              aria-hidden="true"
            >
              <SageOrb size={sourceRect.width} />
            </div>
          )}
        </>
      )}
    </SageTransitionContext.Provider>
  )
}

export function useSageTransition() {
  const context = useContext(SageTransitionContext)
  if (!context) throw new Error('useSageTransition must be used inside SageTransitionProvider')
  return context
}
