import styles from './TipList.module.css'

export default function TipList({ tips }: { tips: string[] }) {
  return (
    <div className={styles.list}>
      {tips.map((tip, i) => (
        <div key={i} className={`${styles.tip} raised`}>
          <div className={`${styles.num} pressed-icon`}>{i + 1}</div>
          <p className={styles.text}>{tip}</p>
        </div>
      ))}
    </div>
  )
}
