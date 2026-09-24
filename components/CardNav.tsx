'use client'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { GoArrowUpRight } from 'react-icons/go'
import Link from 'next/link'
import './CardNav.css'

type CardNavLink = {
  label: string
  href: string
  ariaLabel: string
  /** Route doesn't exist yet — render as a non-navigating, visibly muted placeholder. */
  disabled?: boolean
}

export type CardNavItem = {
  label: string
  links: CardNavLink[]
}

export interface CardNavProps {
  brandLabel?: string
  brandHref?: string
  items: CardNavItem[]
  /** Extra content shown at the bottom of the expanded panel (e.g. theme toggle, sign out). */
  actions?: React.ReactNode
  className?: string
  ease?: string
}

const TOP_BAR_HEIGHT = 60
const CONTENT_PADDING = 16

const CardNav: React.FC<CardNavProps> = ({
  brandLabel = "Alexis's Guide",
  brandHref = '/guide/welcome',
  items,
  actions,
  className = '',
  ease = 'power3.out',
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const navRef = useRef<HTMLDivElement | null>(null)
  const hamburgerRef = useRef<HTMLButtonElement | null>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const prefersReducedMotion = useCallback(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const calculateHeight = useCallback(() => {
    const navEl = navRef.current
    if (!navEl) return TOP_BAR_HEIGHT

    const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement | null
    if (!contentEl) return TOP_BAR_HEIGHT

    const wasVisibility = contentEl.style.visibility
    const wasPointerEvents = contentEl.style.pointerEvents
    const wasPosition = contentEl.style.position
    const wasHeight = contentEl.style.height

    contentEl.style.visibility = 'visible'
    contentEl.style.pointerEvents = 'auto'
    contentEl.style.position = 'static'
    contentEl.style.height = 'auto'

    // Force layout so scrollHeight reflects the true content height.
    void contentEl.offsetHeight
    const contentHeight = contentEl.scrollHeight

    contentEl.style.visibility = wasVisibility
    contentEl.style.pointerEvents = wasPointerEvents
    contentEl.style.position = wasPosition
    contentEl.style.height = wasHeight

    return TOP_BAR_HEIGHT + contentHeight + CONTENT_PADDING
  }, [])

  const createTimeline = useCallback(() => {
    const navEl = navRef.current
    if (!navEl) return null

    const reduced = prefersReducedMotion()
    const duration = reduced ? 0 : 0.4
    const stagger = reduced ? 0 : 0.08

    gsap.set(navEl, { height: TOP_BAR_HEIGHT, overflow: 'hidden' })
    gsap.set(cardsRef.current, { y: reduced ? 0 : 50, opacity: reduced ? 1 : 0 })

    const tl = gsap.timeline({ paused: true })
    tl.to(navEl, { height: calculateHeight, duration, ease })
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration, ease, stagger }, reduced ? 0 : '-=0.1')

    return tl
  }, [calculateHeight, ease, prefersReducedMotion])

  useLayoutEffect(() => {
    const tl = createTimeline()
    tlRef.current = tl
    return () => {
      tl?.kill()
      tlRef.current = null
    }
  }, [createTimeline, items])

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return

      if (isExpanded) {
        const newHeight = calculateHeight()
        gsap.set(navRef.current, { height: newHeight })
        tlRef.current.kill()
        const newTl = createTimeline()
        if (newTl) {
          newTl.progress(1)
          tlRef.current = newTl
        }
      } else {
        tlRef.current.kill()
        tlRef.current = createTimeline()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isExpanded, calculateHeight, createTimeline])

  const openMenu = () => {
    const tl = tlRef.current
    if (!tl) return
    setIsExpanded(true)
    tl.play(0)
  }

  const closeMenu = useCallback(() => {
    const tl = tlRef.current
    if (!tl) return
    tl.eventCallback('onReverseComplete', () => setIsExpanded(false))
    tl.reverse()
  }, [])

  const toggleMenu = () => {
    if (isExpanded) closeMenu()
    else openMenu()
  }

  // Escape key closes the panel, and hands focus back to the menu button —
  // otherwise focus is left on a link that's about to become hidden, and a
  // keyboard user drops back to the top of the page.
  useEffect(() => {
    if (!isExpanded) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      closeMenu()
      hamburgerRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isExpanded, closeMenu])

  // Tapping/clicking outside the nav closes the panel.
  useEffect(() => {
    if (!isExpanded) return
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) closeMenu()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isExpanded, closeMenu])

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el
  }

  const contentId = 'card-nav-content'

  return (
    <div className={`card-nav-container ${className}`}>
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`}>
        <div className="card-nav-top">
          <button
            ref={hamburgerRef}
            type="button"
            className={`hamburger-menu ${isExpanded ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            aria-expanded={isExpanded}
            aria-controls={contentId}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </button>

          <Link href={brandHref} className="logo-container">
            <span className="logo-text">{brandLabel}</span>
          </Link>
        </div>

        <div className="card-nav-content" id={contentId} aria-hidden={!isExpanded}>
          <div className="nav-cards-row">
            {(items || []).slice(0, 3).map((item, idx) => (
              <div key={`${item.label}-${idx}`} className="nav-card" ref={setCardRef(idx)}>
                <div className="nav-card-label">{item.label}</div>
                <div className="nav-card-links">
                  {item.links?.map((lnk, i) =>
                    lnk.disabled ? (
                      <span key={`${lnk.label}-${i}`} className="nav-card-link nav-card-link-disabled" aria-disabled="true">
                        {lnk.label}
                        <span className="nav-card-soon">Soon</span>
                      </span>
                    ) : (
                      <Link key={`${lnk.label}-${i}`} className="nav-card-link" href={lnk.href} aria-label={lnk.ariaLabel} onClick={closeMenu}>
                        <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                        {lnk.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {actions && <div className="nav-actions">{actions}</div>}
        </div>
      </nav>
    </div>
  )
}

export default CardNav
