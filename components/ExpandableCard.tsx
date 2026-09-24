'use client'
import { useId, type ReactNode } from 'react'
import { useScrollReveal } from '@/lib/useScrollReveal'
import styles from './ExpandableCard.module.css'

interface ExpandableCardProps {
  icon?: ReactNode
  title: ReactNode
  meta?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  /** Stays visible even when collapsed, rendered below the collapsible region. */
  persistent?: ReactNode
}

export default function ExpandableCard({ icon, title, meta, open, onToggle, children, persistent }: ExpandableCardProps) {
  const contentId = useId()
  const [revealTarget, revealClass] = useScrollReveal<HTMLDivElement>()

  return (
    <div ref={revealTarget} className={`${styles.card} ${revealClass}`}>
      <button
        type="button"
        className={styles.header}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <div className={styles.headerRow}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.title}>{title}</span>
          <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden="true">›</span>
        </div>
        {meta && <span className={styles.meta}>{meta}</span>}
      </button>

      <div className={styles.collapsible} data-open={open}>
        <div className={styles.inner} id={contentId}>
          <div className={styles.innerContent}>{children}</div>
        </div>
      </div>

      {persistent && <div className={styles.persistent}>{persistent}</div>}
    </div>
  )
}
