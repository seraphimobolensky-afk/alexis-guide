import { groceryTips } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import styles from './groceries.module.css'

export default function GroceriesPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 4"
        title="Planning groceries"
        subtitle="My least favourite part of adulting. These tips make it a lot less painful."
      />
      <div className={styles.list}>
        {groceryTips.map((tip, i) => (
          <div key={i} className={`${styles.tip} raised`}>
            <div className={`${styles.num} pressed-icon`}>{i + 1}</div>
            <p className={styles.text}>{tip}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
