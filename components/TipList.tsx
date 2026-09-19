'use client'
import { useMemo } from 'react'
import type { Bullet } from '@/lib/content'
import { useExpandableGroup } from '@/lib/useExpandableGroup'
import ExpandableCard from './ExpandableCard'
import ExpandAllControl from './ExpandAllControl'
import Bullets from './Bullets'
import styles from './TipList.module.css'

export default function TipList({ tips }: { tips: Bullet[] }) {
  const expandableIds = useMemo(
    () => tips.map((t, i) => (t.children?.length ? `tip-${i}` : null)).filter((id): id is string => id !== null),
    [tips]
  )
  const { isOpen, toggle, allOpen, expandAll, collapseAll } = useExpandableGroup(expandableIds)

  return (
    <div>
      {expandableIds.length > 4 && (
        <ExpandAllControl allOpen={allOpen} onExpandAll={expandAll} onCollapseAll={collapseAll} />
      )}
      <div className={styles.list}>
        {tips.map((tip, i) => {
          const num = <span className={`${styles.num} pressed-icon`}>{i + 1}</span>

          if (!tip.children || tip.children.length === 0) {
            return (
              <div key={i} className={`${styles.tip} raised`}>
                {num}
                <p className={styles.text}>{tip.text}</p>
              </div>
            )
          }

          const id = `tip-${i}`
          return (
            <ExpandableCard
              key={i}
              icon={num}
              title={tip.text}
              open={isOpen(id)}
              onToggle={() => toggle(id)}
            >
              <Bullets items={tip.children} level={1} />
            </ExpandableCard>
          )
        })}
      </div>
    </div>
  )
}
