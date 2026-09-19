import styles from './SectionHeader.module.css'

interface Props {
  eyebrow: string
  title: string
  subtitle?: string | string[]
}

export default function SectionHeader({ eyebrow, title, subtitle }: Props) {
  const paragraphs = Array.isArray(subtitle) ? subtitle : subtitle ? [subtitle] : []

  return (
    <div className={styles.header}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.title}>{title}</h2>
      {paragraphs.map((p, i) => (
        <p key={i} className={styles.subtitle}>{p}</p>
      ))}
    </div>
  )
}
