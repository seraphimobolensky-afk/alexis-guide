import { appliances, type Appliance } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import Bullets from '@/components/Bullets'
import styles from './appliances.module.css'

function necessityScore(necessity: Appliance['necessity']): number {
  const parts = necessity.split('-').map(Number).filter(n => !Number.isNaN(n))
  return parts.length ? Math.max(...parts) : 0
}

function NecessityDots({ necessity }: { necessity: string }) {
  const n = necessityScore(necessity)
  return (
    <div className={styles.necessity}>
      <div className={styles.dots} aria-label={`Necessity ${necessity} out of 5`}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`${styles.dot} ${i <= n ? styles.filled : ''}`} />
        ))}
      </div>
      <span className={styles.necessityText}>{necessity}/5</span>
    </div>
  )
}

export default function AppliancesPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 3"
        title="Appliances"
      />
      <div className={styles.grid}>
        {appliances.map(a => (
          <div key={a.key} className={`${styles.card} raised`}>
            <div className={styles.top}>
              <h3 className={styles.name}>{a.name}</h3>
              <NecessityDots necessity={a.necessity} />
            </div>
            {a.use && <p className={styles.use}>{a.use}</p>}
            <Bullets items={a.bullets} />
          </div>
        ))}
      </div>
    </div>
  )
}
