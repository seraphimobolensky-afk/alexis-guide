'use client'
import { useState } from 'react'
import { recipes } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import styles from './recipes.module.css'

export default function RecipesPage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      <SectionHeader
        eyebrow="Section 5"
        title="Recipes"
        subtitle="Easy meals I've learned to love. Tap one to see the full recipe."
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
                <div className={styles.body}>
                  <div className={styles.col}>
                    <p className={styles.colLabel}>Ingredients</p>
                    <ul className={styles.ingredients}>
                      {r.ingredients.map((ing, i) => (
                        <li key={i} className={styles.ingredient}>
                          <span className={`${styles.bullet} pressed-icon`} />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.col}>
                    <p className={styles.colLabel}>Steps</p>
                    <ol className={styles.steps}>
                      {r.steps.map((step, i) => (
                        <li key={i} className={styles.step}>
                          <div className={`${styles.stepNum} pressed-icon`}>{i + 1}</div>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
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
