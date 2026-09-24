'use client'
import { useEffect, useState } from 'react'

/**
 * The React Bits "Animated List" item effect: each list item scales up from
 * 0.7 and fades in as it scrolls into view, and scales back down as it
 * leaves — every time, not just once. Same timing as the original (200ms,
 * 100ms delay), done with an IntersectionObserver + CSS transition (see
 * `.reveal` in globals.css) instead of pulling in the `motion` library.
 *
 * Deliberate difference from the original's "50% of the item visible"
 * trigger: an expanded card taller than two screens can never be 50%
 * visible, so it would fade out while you're reading it. Instead an item
 * counts as in view while any part of it is inside the middle 80% of the
 * screen, which feels the same for normal-sized items.
 *
 * Usage: `const [revealTarget, revealClass] = useScrollReveal<HTMLDivElement>()`
 * then `<div ref={revealTarget} className={`${styles.card} ${revealClass}`}>`.
 */
export function useScrollReveal<T extends HTMLElement>() {
  // A callback ref (element in state) rather than a ref object, so the
  // observer re-attaches if the element is ever swapped out.
  const [element, setElement] = useState<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true) // eslint-disable-line react-hooks/set-state-in-effect -- no observer support: just show it
      return
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '-10% 0px -10% 0px',
      threshold: 0,
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return [setElement, `reveal${inView ? ' reveal-in' : ''}`] as const
}
