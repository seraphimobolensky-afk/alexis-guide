'use client'
import { useMemo } from 'react'
import type { CleaningTask } from '@/lib/content'
import { useExpandableGroup } from '@/lib/useExpandableGroup'
import ChecklistCard from './ChecklistCard'
import ExpandAllControl from './ExpandAllControl'
import styles from '@/app/guide/cleaning/cleaning.module.css'

interface Props {
  tasks: CleaningTask[]
  completions: Record<string, boolean>
}

export default function CleaningList({ tasks, completions }: Props) {
  const ids = useMemo(() => tasks.map(t => t.key), [tasks])
  const { isOpen, toggle, allOpen, expandAll, collapseAll } = useExpandableGroup(ids)

  return (
    <div>
      {tasks.length > 4 && (
        <ExpandAllControl allOpen={allOpen} onExpandAll={expandAll} onCollapseAll={collapseAll} />
      )}
      <div className={styles.grid}>
        {tasks.map(task => (
          <ChecklistCard
            key={task.key}
            taskKey={task.key}
            icon={task.icon}
            title={task.title}
            frequency={task.frequency}
            bullets={task.bullets}
            initialChecked={!!completions[task.key]}
            open={isOpen(task.key)}
            onToggle={() => toggle(task.key)}
          />
        ))}
      </div>
    </div>
  )
}
