import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

interface ModalProps {
  onClose: () => void
  children: ReactNode
  /** Overrides on the panel (e.g. maxWidth, padding). */
  panelStyle?: CSSProperties
  /** id of the element that labels the dialog, for a11y. */
  labelledBy?: string
}

/**
 * Lightweight modal built on the bespoke Admyt CSS system.
 * Closes on backdrop click and Escape, and locks body scroll while open.
 */
export default function Modal({ onClose, children, panelStyle, labelledBy }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Focus trap: move focus into the dialog on open and keep Tab cycling inside it.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const prevFocused = document.activeElement as HTMLElement | null
    const focusables = () => Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    focusables()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    panel.addEventListener('keydown', onKeyDown)
    return () => {
      panel.removeEventListener('keydown', onKeyDown)
      prevFocused?.focus?.()
    }
  }, [])

  return (
    <div className="admyt-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="admyt-modal-panel"
        style={panelStyle}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>
  )
}
