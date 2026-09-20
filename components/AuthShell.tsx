import type { ReactNode } from 'react'
import AuthWarpBackground from './AuthWarpBackground'
import ThemeToggle from './ThemeToggle'
import styles from './AuthShell.module.css'

export default function AuthShell({ warpText, children }: { warpText: string; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.pageGradient} aria-hidden="true" />
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.themeToggleSlot}>
        <ThemeToggle />
      </div>

      <div className={styles.content}>
        <div className={styles.textZone}>
          <AuthWarpBackground text={warpText} />
        </div>
        <div className={styles.card}>{children}</div>
      </div>
    </div>
  )
}
