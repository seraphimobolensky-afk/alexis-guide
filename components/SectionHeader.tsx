import styles from './SectionHeader.module.css'

interface Props {
  eyebrow: string
  title: string
  subtitle: string
}

export default function SectionHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <div className={styles.header}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  )
}
