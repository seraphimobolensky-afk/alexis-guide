'use client'
import { useState, useTransition } from 'react'
import { toggleChecklist } from '@/app/actions'
import type { Bullet } from '@/lib/content'
import ExpandableCard from './ExpandableCard'
import Bullets from './Bullets'
import styles from './ChecklistCard.module.css'

interface Props {
  taskKey: string
  icon: string
  title: string
  frequency: string
  bullets: Bullet[]
  initialChecked: boolean
  open: boolean
  onToggle: () => void
}

export default function ChecklistCard({ taskKey, icon, title, frequency, bullets, initialChecked, open, onToggle }: Props) {
  const [checked, setChecked] = useState(initialChecked)
  const [pending, startTransition] = useTransition()

  function toggleDone() {
    const next = !checked
    setChecked(next)
    startTransition(() => toggleChecklist('cleaning', taskKey, next))
  }

  return (
    <ExpandableCard
      icon={icon}
      title={title}
      meta={frequency}
      open={open}
      onToggle={onToggle}
      persistent={
        <button
          onClick={toggleDone}
          disabled={pending}
          className={`${styles.check} ${checked ? styles.checkDone + ' pressed-sm' : 'raised-sm'}`}
          aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
        >
          {checked ? '✓ Done this week' : 'Mark done'}
        </button>
      }
    >
      <Bullets items={bullets} />
    </ExpandableCard>
  )
}
