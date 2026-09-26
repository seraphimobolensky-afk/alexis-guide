'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { navGroups } from '@/lib/navGroups'
import CardNav, { type CardNavItem } from './CardNav'
import ThemeToggle from './ThemeToggle'
import styles from './GuideNav.module.css'

export default function GuideNav() {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const items: CardNavItem[] = navGroups.map(group => ({
    label: group.label,
    links: group.links.map(link => ({
      label: link.label,
      href: link.href,
      ariaLabel: link.disabled ? `${link.label} — coming soon` : `Go to ${link.label}`,
      disabled: link.disabled,
    })),
  }))

  return (
    <CardNav
      items={items}
      brandLabel="SeraSays"
      brandHref="/guide/welcome"
      actions={
        <>
          <button type="button" onClick={signOut} className={styles.signOut}>
            Sign out
          </button>
          <ThemeToggle />
        </>
      }
    />
  )
}
