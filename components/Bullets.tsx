import type { Bullet } from '@/lib/content'
import styles from './Bullets.module.css'

export default function Bullets({ items, level = 0 }: { items: Bullet[]; level?: number }) {
  if (items.length === 0) return null

  return (
    <ul className={styles.list} data-level={level}>
      {items.map((item, i) => (
        <li key={i} className={styles.item}>
          <span className={styles.marker} aria-hidden="true" />
          <div className={styles.body}>
            <p className={styles.text}>{item.text}</p>
            {item.children && item.children.length > 0 && (
              <Bullets items={item.children} level={level + 1} />
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
