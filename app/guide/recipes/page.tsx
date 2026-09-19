'use client'
import { useState } from 'react'
import { recipes } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import Bullets from '@/components/Bullets'
import styles from './recipes.module.css'

export default function RecipesPage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      <SectionHeader
        eyebrow="Section 5"
        title="Easy recipes that I like"
      />
      <div className={styles.list}>
        {recipes.map(r => {
          const isOpen = open === r.key
          return (
            <div key={r.key} className={`${styles.card} raised`}>
              <button
                className={styles.toggle}
                onClick={() => setOpen(isOpen ? null : r.key)}
              >
                <span className={styles.emoji}>{r.emoji}</span>
                <span className={styles.recipeTitle}>{r.title}</span>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>›</span>
              </button>

              {isOpen && (
                <div className={styles.expanded}>
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
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
