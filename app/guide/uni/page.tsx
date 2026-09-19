import { uniTips, uniIntro, closingNote } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import TipList from '@/components/TipList'
import styles from './uni.module.css'

export default function UniPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Bonus"
        title="Academic tips"
        subtitle={uniIntro}
      />
      <TipList tips={uniTips} />

      <div className={`${styles.closing} raised`}>
        <p className={styles.closingEyebrow}>Final note</p>
        {closingNote.paragraphs.map((p, i) => (
          <p key={i} className={styles.closingText}>{p}</p>
        ))}
      </div>
    </div>
  )
}
