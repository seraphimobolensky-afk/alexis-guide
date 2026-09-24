'use client'
import type { ReactNode } from 'react'
import { useScrollReveal } from '@/lib/useScrollReveal'

/** Wrapper form of `useScrollReveal`, for list items rendered inline in a `.map()`. */
export default function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [revealTarget, revealClass] = useScrollReveal<HTMLDivElement>()
  return (
    <div ref={revealTarget} className={`${className} ${revealClass}`}>
      {children}
    </div>
  )
}
