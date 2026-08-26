import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  onClose: () => void
  children: ReactNode
  /** Optional modifier for dialog-specific overlay positioning. */
  overlayClassName?: string
  /** Overrides on the panel (e.g. maxWidth, padding). */
  panelStyle?: CSSProperties
  /** id of the element that labels the dialog, for a11y. */
  labelledBy?: string
}

/**
 * Lightweight modal built on the bespoke Admyt CSS system.
 * Closes on backdrop click and Escape, and locks body scroll while open.
 */
export default function Modal({ onClose, children, overlayClassName, panelStyle, labelledBy }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    const appRoot = document.getElementById('root')
    const prevAriaHidden = appRoot?.getAttribute('aria-hidden')
    document.body.style.overflow = 'hidden'
    if (appRoot) {
      appRoot.inert = true
      appRoot.setAttribute('aria-hidden', 'true')
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (appRoot) {
        appRoot.inert = false
        if (prevAriaHidden == null) appRoot.removeAttribute('aria-hidden')
        else appRoot.setAttribute('aria-hidden', prevAriaHidden)
      }
    }
  }, [onClose])

  // Focus trap: focus the dialog itself on open so browsers do not scroll a tall
  // panel to its first control, then keep Tab cycling inside it.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const prevFocused = document.activeElement as HTMLElement | null
    const focusables = () => Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    panel.focus({ preventScroll: true })
    panel.scrollTop = 0

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (document.activeElement === panel) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      } else if (e.shiftKey && document.activeElement === first) {
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

  return createPortal(
    <div className={`admyt-overlay${overlayClassName ? ` ${overlayClassName}` : ''}`} onClick={onClose}>
      <div
        ref={panelRef}
        className="admyt-modal-panel"
        style={panelStyle}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
