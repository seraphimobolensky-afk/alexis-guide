import type { ReactNode } from 'react'
import AuthWarpBackground from './AuthWarpBackground'
import styles from './AuthShell.module.css'

export default function AuthShell({ warpText, children }: { warpText: string; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <AuthWarpBackground text={warpText} />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.card}>{children}</div>
    </div>
  )
}
