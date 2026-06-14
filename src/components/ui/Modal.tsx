import { useEffect, type CSSProperties, type ReactNode } from 'react'

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

  return (
    <div className="admyt-overlay" onClick={onClose}>
      <div
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
