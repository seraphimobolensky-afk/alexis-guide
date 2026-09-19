'use client'
import { useMemo } from 'react'
import { appliances, type Appliance } from '@/lib/content'
import { useExpandableGroup } from '@/lib/useExpandableGroup'
import SectionHeader from '@/components/SectionHeader'
import ExpandableCard from '@/components/ExpandableCard'
import ExpandAllControl from '@/components/ExpandAllControl'
import Bullets from '@/components/Bullets'
import styles from './appliances.module.css'

function necessityScore(necessity: Appliance['necessity']): number {
  const parts = necessity.split('-').map(Number).filter(n => !Number.isNaN(n))
  return parts.length ? Math.max(...parts) : 0
}

function NecessityMeta({ necessity }: { necessity: string }) {
  const n = necessityScore(necessity)
  return (
    <span className={styles.necessity}>
      <span className={styles.dots} aria-hidden="true">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`${styles.dot} ${i <= n ? styles.filled : ''}`} />
        ))}
      </span>
      {necessity}/5
    </span>
  )
}

export default function AppliancesPage() {
  const ids = useMemo(() => appliances.map(a => a.key), [])
  const { isOpen, toggle, allOpen, expandAll, collapseAll } = useExpandableGroup(ids)

  return (
    <div>
      <SectionHeader
        eyebrow="Section 3"
        title="Appliances"
      />
      {appliances.length > 4 && (
        <ExpandAllControl allOpen={allOpen} onExpandAll={expandAll} onCollapseAll={collapseAll} />
      )}
      <div className={styles.list}>
        {appliances.map(a => (
          <ExpandableCard
            key={a.key}
            title={a.name}
            meta={<NecessityMeta necessity={a.necessity} />}
            open={isOpen(a.key)}
            onToggle={() => toggle(a.key)}
          >
            {a.use && <p className={styles.use}>{a.use}</p>}
            <Bullets items={a.bullets} />
          </ExpandableCard>
        ))}
      </div>
    </div>
  )
}
