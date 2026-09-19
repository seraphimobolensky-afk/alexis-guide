'use client'
import { useEffect, useState } from 'react'

/**
 * Resolves a CSS custom property (e.g. "--accent") to its current literal
 * color value, for handing to canvas/WebGL code that can't read var(...)
 * itself. Returns `fallback` during SSR and the initial client render (so
 * there's no hydration mismatch), then updates after mount and stays in
 * sync with theme changes (the data-theme attribute, or the OS-level
 * light/dark switch when no override is set).
 */
export function useResolvedCssVar(name: string, fallback: string): string {
  const [value, setValue] = useState(fallback)

  useEffect(() => {
    const resolve = () => {
      const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      if (resolved) setValue(resolved)
    }
    resolve()

    const observer = new MutationObserver(resolve)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
    mql?.addEventListener('change', resolve)

    return () => {
      observer.disconnect()
      mql?.removeEventListener('change', resolve)
    }
  }, [name])

  return value
}
