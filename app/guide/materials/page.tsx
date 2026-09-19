'use client'
import { useMemo } from 'react'
import { cleaningMaterials, materialsIntro } from '@/lib/content'
import { useExpandableGroup } from '@/lib/useExpandableGroup'
import SectionHeader from '@/components/SectionHeader'
import ExpandableCard from '@/components/ExpandableCard'
import ExpandAllControl from '@/components/ExpandAllControl'
import Bullets from '@/components/Bullets'
import styles from './materials.module.css'

export default function MaterialsPage() {
  const ids = useMemo(() => cleaningMaterials.map((_, i) => `material-${i}`), [])
  const { isOpen, toggle, allOpen, expandAll, collapseAll } = useExpandableGroup(ids)

  return (
    <div>
      <SectionHeader
        eyebrow="Section 2"
        title="Cleaning materials"
        subtitle={materialsIntro}
      />
      {cleaningMaterials.length > 4 && (
        <ExpandAllControl allOpen={allOpen} onExpandAll={expandAll} onCollapseAll={collapseAll} />
      )}
      <div className={styles.list}>
        {cleaningMaterials.map((m, i) => (
          <ExpandableCard
            key={i}
            title={m.type}
            open={isOpen(ids[i])}
            onToggle={() => toggle(ids[i])}
          >
            <Bullets items={m.bullets} />
          </ExpandableCard>
        ))}
      </div>
    </div>
  )
}
