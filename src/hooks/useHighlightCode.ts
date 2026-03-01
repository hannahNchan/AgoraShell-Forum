import { useEffect } from 'react'
import { createLowlight, common } from 'lowlight'
import { toHtml } from 'hast-util-to-html'

const lowlight = createLowlight(common)

const highlightBlock = (code: HTMLElement) => {
  if (code.dataset.highlighted === 'true') return

  const raw = code.textContent ?? ''
  const className = code.className || ''
  const match = className.match(/language-(\w+)/)
  const lang = match ? match[1] : null

  try {
    const tree = lang && lang !== 'plaintext'
      ? lowlight.highlight(lang, raw)
      : lowlight.highlightAuto(raw)

    code.innerHTML = toHtml(tree)
    code.dataset.highlighted = 'true'
  } catch {
    code.dataset.highlighted = 'true'
  }
}

export const useHighlightCode = (containerRef: React.RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scan = () => {
      container.querySelectorAll<HTMLElement>('pre code').forEach(highlightBlock)
    }

    scan()

    const observer = new MutationObserver(scan)
    observer.observe(container, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [containerRef])
}
