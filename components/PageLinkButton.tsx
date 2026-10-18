import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './PageLinkButton.module.css'

/** A small raised pill that links to a sibling page (grocery list ↔ meal planner). */
export default function PageLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${styles.button} raised-sm`}>
      {children}
    </Link>
  )
}
