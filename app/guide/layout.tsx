import Sidebar from '@/components/Sidebar'
import styles from './layout.module.css'

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
