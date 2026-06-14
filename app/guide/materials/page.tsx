import { cleaningMaterials } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import styles from './materials.module.css'

export default function MaterialsPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 2"
        title="Cleaning materials"
        subtitle="Everything I've found useful over 3 years. Brands don't matter much — grocery store own-brand is fine. B&M Bargains has good prices too."
      />
      <div className={styles.list}>
        {cleaningMaterials.map((m, i) => (
          <div key={i} className={`${styles.row} raised`}>
            <span className={styles.type}>{m.type}</span>
            <span className={styles.fn}>{m.function}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
