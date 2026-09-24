import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isEmailAllowed } from '@/lib/auth'
import GuideNav from '@/components/GuideNav'
import styles from './layout.module.css'

export default async function GuideLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }
  // The server-side allowlist check (see app/auth/not-invited/route.ts).
  if (!isEmailAllowed(user.email ?? '')) {
    redirect('/auth/not-invited')
  }

  return (
    <div className={styles.shell}>
      <GuideNav />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
