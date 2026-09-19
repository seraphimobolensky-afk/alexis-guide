import type { Bullet } from '@/lib/content'
import Bullets from './Bullets'
import styles from './TipList.module.css'

export default function TipList({ tips }: { tips: Bullet[] }) {
  return (
    <div className={styles.list}>
      {tips.map((tip, i) => (
        <div key={i} className={`${styles.tip} raised`}>
          <div className={`${styles.num} pressed-icon`}>{i + 1}</div>
          <div className={styles.body}>
            <p className={styles.text}>{tip.text}</p>
            {tip.children && tip.children.length > 0 && (
              <Bullets items={tip.children} level={1} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
