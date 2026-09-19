import { welcomeLetter } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import styles from './welcome.module.css'

export default function WelcomePage() {
  return (
    <div>
      <SectionHeader eyebrow="Start here" title="Dear Alexis" />
      <div className={`${styles.letter} raised`}>
        {welcomeLetter.paragraphs.map((p, i) => (
          <p key={i} className={styles.paragraph}>{p}</p>
        ))}

        <p className={styles.listTitle}>{welcomeLetter.listTitle}</p>
        <ol className={styles.list}>
          {welcomeLetter.list.map((item, i) => (
            <li key={i} className={styles.listItem}>
              <span className={`${styles.num} pressed-icon`}>{i + 1}</span>
              <span className={styles.listText}>{item.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
