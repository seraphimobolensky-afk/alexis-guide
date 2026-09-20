'use client'
import { useState, useTransition } from 'react'
import { logHabitEntry, removeHabitEntry } from '@/app/actions'
import type { Bullet } from '@/lib/content'
import ExpandableCard from './ExpandableCard'
import Bullets from './Bullets'
import styles from './ChecklistCard.module.css'

interface Props {
  habitId: string
  icon: string
  title: string
  frequency: string
  bullets: Bullet[]
  doneToday: boolean
  doneInWindow: boolean
  lastDoneLabel: string | null
  open: boolean
  onToggle: () => void
}

export default function ChecklistCard({
  habitId,
  icon,
  title,
  frequency,
  bullets,
  doneToday,
  doneInWindow,
  lastDoneLabel,
  open,
  onToggle,
}: Props) {
  const [checked, setChecked] = useState(doneToday)
  const [pending, startTransition] = useTransition()

  function toggleDone() {
    const next = !checked
    setChecked(next)
    startTransition(async () => {
      if (next) {
        await logHabitEntry({ habitId })
      } else {
        await removeHabitEntry({ habitId })
      }
    })
  }

  const statusText = checked
    ? 'Done today'
    : doneInWindow && lastDoneLabel
      ? `Done — last done ${lastDoneLabel}`
      : lastDoneLabel
        ? `Last done ${lastDoneLabel}`
        : 'Not logged yet'

  return (
    <ExpandableCard
      icon={icon}
      title={title}
      meta={frequency}
      open={open}
      onToggle={onToggle}
      persistent={
        <div className={styles.status}>
          <p className={styles.lastDone}>{statusText}</p>
          <button
            onClick={toggleDone}
            disabled={pending}
            className={`${styles.check} ${checked ? styles.checkDone + ' pressed-sm' : 'raised-sm'}`}
            aria-label={checked ? "Remove today's entry" : 'Mark done today'}
          >
            {checked ? '✓ Done today' : 'Mark done'}
          </button>
        </div>
      }
    >
      <Bullets items={bullets} />
    </ExpandableCard>
  )
}
