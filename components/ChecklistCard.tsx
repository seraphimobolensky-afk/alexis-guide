'use client'
import { useState, useTransition } from 'react'
import { toggleChecklist } from '@/app/actions'
import styles from './ChecklistCard.module.css'

interface Props {
  taskKey: string
  icon: string
  title: string
  frequency: string
  tip: string
  initialChecked: boolean
}

export default function ChecklistCard({ taskKey, icon, title, frequency, tip, initialChecked }: Props) {
  const [checked, setChecked] = useState(initialChecked)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !checked
    setChecked(next)
    startTransition(() => toggleChecklist('cleaning', taskKey, next))
  }

  return (
    <div className={styles.cell}>
      <div className={`${styles.card} raised ${checked ? styles.done : ''}`}>
        <div className={styles.top}>
          <div className={`${styles.iconBox} pressed-icon`}>{icon}</div>
          <div className={`${styles.badge} pressed-sm`}>
            <span className={styles.badgeText}>{frequency.toUpperCase()}</span>
          </div>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.tip}>{tip}</p>
        <button
          onClick={toggle}
          disabled={pending}
          className={`${styles.check} ${checked ? styles.checkDone + ' pressed-sm' : 'raised-sm'}`}
          aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
        >
          {checked ? '✓ Done this week' : 'Mark done'}
        </button>
      </div>
    </div>
  )
}
