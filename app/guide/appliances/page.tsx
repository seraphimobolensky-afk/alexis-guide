import { appliances } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import styles from './appliances.module.css'

function NecessityDots({ n }: { n: number }) {
  return (
    <div className={styles.dots} aria-label={`Necessity ${n} out of 5`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`${styles.dot} ${i <= n ? styles.filled : ''}`} />
      ))}
    </div>
  )
}

export default function AppliancesPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 3"
        title="Appliances"
        subtitle="What to actually buy — and what can wait. Dots = how necessary it is (my opinion)."
      />
      <div className={styles.grid}>
        {appliances.map(a => (
          <div key={a.key} className={`${styles.card} raised`}>
            <div className={styles.top}>
              <h3 className={styles.name}>{a.name}</h3>
              <NecessityDots n={a.necessity} />
            </div>
            <p className={styles.notes}>{a.notes}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
