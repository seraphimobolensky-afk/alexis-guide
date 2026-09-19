import { cleaningMaterials, materialsIntro } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import Bullets from '@/components/Bullets'
import styles from './materials.module.css'

export default function MaterialsPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 2"
        title="Cleaning materials"
        subtitle={materialsIntro}
      />
      <div className={styles.list}>
        {cleaningMaterials.map((m, i) => (
          <div key={i} className={`${styles.row} raised`}>
            <span className={styles.type}>{m.type}</span>
            <Bullets items={m.bullets} />
          </div>
        ))}
      </div>
    </div>
  )
}
