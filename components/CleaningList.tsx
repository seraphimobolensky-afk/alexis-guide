'use client'
import { useMemo } from 'react'
import type { CleaningTask } from '@/lib/content'
import type { CleaningHabitStatus } from '@/app/guide/cleaning/data'
import { useExpandableGroup } from '@/lib/useExpandableGroup'
import ChecklistCard from './ChecklistCard'
import ExpandAllControl from './ExpandAllControl'
import styles from '@/app/guide/cleaning/cleaning.module.css'

interface Props {
  tasks: CleaningTask[]
  statuses: Record<string, CleaningHabitStatus>
}

export default function CleaningList({ tasks, statuses }: Props) {
  const ids = useMemo(() => tasks.map(t => t.key), [tasks])
  const { isOpen, toggle, allOpen, expandAll, collapseAll } = useExpandableGroup(ids)

  if (Object.keys(statuses).length === 0) {
    return (
      <p className={styles.setupNote}>
        Couldn&rsquo;t load your cleaning checklist right now. Try reloading the page in a moment.
      </p>
    )
  }

  return (
    <div>
      {tasks.length > 4 && (
        <ExpandAllControl allOpen={allOpen} onExpandAll={expandAll} onCollapseAll={collapseAll} />
      )}
      <div className={styles.grid}>
        {tasks.map(task => {
          const status = statuses[task.key]
          if (!status) return null

          return (
            <ChecklistCard
              key={task.key}
              habitId={status.habitId}
              icon={task.icon}
              title={task.title}
              frequency={task.frequency}
              bullets={task.bullets}
              doneToday={status.doneToday}
              doneInWindow={status.doneInWindow}
              lastDoneLabel={status.lastDoneLabel}
              open={isOpen(task.key)}
              onToggle={() => toggle(task.key)}
            />
          )
        })}
      </div>
    </div>
  )
}
