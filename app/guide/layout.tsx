import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuideNav from '@/components/GuideNav'
import styles from './layout.module.css'

export default async function GuideLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className={styles.shell}>
      <GuideNav />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
