import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const WIDGET_STYLE_ID = 'admyt-widget-overrides'
const WIDGET_OVERRIDES = `
  :host([data-admyt-hide-trigger]) .trigger { display: none !important; }

  @media (max-width: 767px) {
    .trigger { display: none !important; }
    input, textarea { font-size: 16px !important; }
  }
`

function getWidgetRoot() {
  return document.getElementById('hidustin-bug-widget')?.shadowRoot ?? null
}

function configureWidget(hideTrigger: boolean) {
  const host = document.getElementById('hidustin-bug-widget')
  const root = host?.shadowRoot
  if (!host || !root) return

  host.toggleAttribute('data-admyt-hide-trigger', hideTrigger)
  if (root.getElementById(WIDGET_STYLE_ID)) return

  const style = document.createElement('style')
  style.id = WIDGET_STYLE_ID
  style.textContent = WIDGET_OVERRIDES
  root.appendChild(style)
}

export function openBugReportWidget() {
  getWidgetRoot()?.querySelector<HTMLButtonElement>('.trigger')?.click()
}

export default function BugReportWidget() {
  const { pathname } = useLocation()
  const hideTrigger = pathname === '/'

  useEffect(() => {
    const applyConfiguration = () => configureWidget(hideTrigger)
    applyConfiguration()
    const observer = new MutationObserver(applyConfiguration)
    observer.observe(document.body, { childList: true })
    return () => observer.disconnect()
  }, [hideTrigger])

  return null
}
