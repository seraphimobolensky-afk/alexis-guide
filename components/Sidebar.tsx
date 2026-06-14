'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { sections } from '@/lib/content'
import { createClient } from '@/lib/supabase/client'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <p className={styles.eyebrow}>Guide for</p>
        <h1 className={styles.name}>Alexis</h1>
      </div>

      <p className={styles.sectionLabel}>Sections</p>

      <nav className={styles.nav}>
        {sections.map(s => {
          const active = pathname === `/guide/${s.key}`
          return (
            <Link
              key={s.key}
              href={`/guide/${s.key}`}
              className={`${styles.navItem} ${active ? styles.active + ' pressed-sm' : 'raised-sm'}`}
            >
              <span className={styles.navIcon}>{s.icon}</span>
              <span className={styles.navLabel}>{s.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={styles.footer}>
        <div className={`${styles.avatar} raised-sm`}>S</div>
        <button onClick={signOut} className={styles.signOut}>Sign out</button>
      </div>
    </aside>
  )
}
