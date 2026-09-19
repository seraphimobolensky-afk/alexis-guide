'use client'
import { useMemo } from 'react'
import { recipes } from '@/lib/content'
import { useExpandableGroup } from '@/lib/useExpandableGroup'
import SectionHeader from '@/components/SectionHeader'
import ExpandableCard from '@/components/ExpandableCard'
import ExpandAllControl from '@/components/ExpandAllControl'
import Bullets from '@/components/Bullets'
import styles from './recipes.module.css'

export default function RecipesPage() {
  const ids = useMemo(() => recipes.map(r => r.key), [])
  const { isOpen, toggle, allOpen, expandAll, collapseAll } = useExpandableGroup(ids)

  return (
    <div>
      <SectionHeader
        eyebrow="Section 5"
        title="Easy recipes that I like"
      />
      {recipes.length > 4 && (
        <ExpandAllControl allOpen={allOpen} onExpandAll={expandAll} onCollapseAll={collapseAll} />
      )}
      <div className={styles.list}>
        {recipes.map(r => (
          <ExpandableCard
            key={r.key}
            icon={<span className={styles.emoji}>{r.emoji}</span>}
            title={r.title}
            open={isOpen(r.key)}
            onToggle={() => toggle(r.key)}
          >
            {r.intro && <p className={styles.intro}>{r.intro}</p>}
            <div className={styles.body}>
              <div className={styles.col}>
                <p className={styles.colLabel}>Ingredients</p>
                <Bullets items={r.ingredients} />
              </div>
              <div className={styles.col}>
                <p className={styles.colLabel}>Steps</p>
                <ol className={styles.steps}>
                  {r.steps.map((step, i) => (
                    <li key={i} className={styles.step}>
                      <div className={`${styles.stepNum} pressed-icon`}>{i + 1}</div>
                      <div className={styles.stepBody}>
                        <p className={styles.stepText}>{step.text}</p>
                        {step.children && step.children.length > 0 && (
                          <Bullets items={step.children} level={1} />
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </ExpandableCard>
        ))}
      </div>
    </div>
  )
}
