import { useEffect } from 'react'

const COLLAPSE_THRESHOLD = 6
const COLLAPSED_HEIGHT = '7.5rem'

const applyCollapse = (pre: HTMLPreElement) => {
  if (pre.dataset.collapseInit === 'true') return

  const code = pre.querySelector('code')
  const text = code ? code.textContent : pre.textContent
  const lines = text?.split('\n') ?? []

  if (lines.length <= COLLAPSE_THRESHOLD) return

  pre.dataset.collapseInit = 'true'

  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    position: relative;
    border-radius: 0.5rem;
    overflow: hidden;
  `

  pre.parentNode?.insertBefore(wrapper, pre)
  wrapper.appendChild(pre)

  pre.style.maxHeight = COLLAPSED_HEIGHT
  pre.style.overflowX = 'auto'
  pre.style.overflowY = 'hidden'
  pre.style.marginBottom = '0'
  pre.style.borderBottomLeftRadius = '0'
  pre.style.borderBottomRightRadius = '0'

  const fade = document.createElement('div')
  fade.style.cssText = `
    position: absolute;
    bottom: 28px;
    left: 0;
    right: 0;
    height: 3rem;
    background: linear-gradient(to bottom, transparent, #1e1e2e);
    pointer-events: none;
  `
  wrapper.appendChild(fade)

  const btn = document.createElement('button')
  btn.textContent = `Mostrar ${lines.length} líneas`
  btn.style.cssText = `
    display: block;
    width: 100%;
    padding: 5px 0;
    background: #181825;
    color: #94a3b8;
    font-size: 11px;
    font-family: monospace;
    border: none;
    border-top: 1px solid #334155;
    cursor: pointer;
    text-align: center;
    transition: color 0.15s;
  `
  btn.onmouseenter = () => { btn.style.color = '#e2e8f0' }
  btn.onmouseleave = () => { btn.style.color = '#94a3b8' }

  wrapper.appendChild(btn)

  pre.dataset.collapsed = 'true'

  btn.onclick = () => {
    const collapsed = pre.dataset.collapsed !== 'false'
    if (collapsed) {
      pre.style.maxHeight = 'none'
      pre.style.overflowY = 'visible'
      pre.dataset.collapsed = 'false'
      btn.textContent = 'Colapsar'
      fade.style.display = 'none'
    } else {
      pre.style.maxHeight = COLLAPSED_HEIGHT
      pre.style.overflowY = 'hidden'
      pre.dataset.collapsed = 'true'
      btn.textContent = `Mostrar ${lines.length} líneas`
      fade.style.display = 'block'
    }
  }
}

const scanAndCollapse = (container: HTMLElement) => {
  container.querySelectorAll<HTMLPreElement>('pre').forEach(applyCollapse)
}

export const useCodeCollapse = (containerRef: React.RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    scanAndCollapse(container)

    const observer = new MutationObserver(() => {
      scanAndCollapse(container)
    })

    observer.observe(container, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [containerRef])
}
