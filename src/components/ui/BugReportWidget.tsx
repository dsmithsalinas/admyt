import { useEffect } from 'react'

const MOBILE_WIDGET_STYLE_ID = 'admyt-mobile-widget-overrides'
const MOBILE_WIDGET_OVERRIDES = `
  @media (max-width: 767px) {
    .trigger { display: none !important; }
    input, textarea { font-size: 16px !important; }
  }
`

function getWidgetRoot() {
  return document.getElementById('hidustin-bug-widget')?.shadowRoot ?? null
}

function applyMobileOverrides() {
  const root = getWidgetRoot()
  if (!root || root.getElementById(MOBILE_WIDGET_STYLE_ID)) return

  const style = document.createElement('style')
  style.id = MOBILE_WIDGET_STYLE_ID
  style.textContent = MOBILE_WIDGET_OVERRIDES
  root.appendChild(style)
}

export function openBugReportWidget() {
  getWidgetRoot()?.querySelector<HTMLButtonElement>('.trigger')?.click()
}

export default function BugReportWidget() {
  useEffect(() => {
    applyMobileOverrides()
    const observer = new MutationObserver(applyMobileOverrides)
    observer.observe(document.body, { childList: true })
    return () => observer.disconnect()
  }, [])

  return null
}
