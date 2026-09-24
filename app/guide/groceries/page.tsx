import Link from 'next/link'
import { groceryTips, groceriesIntro } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import TipList from '@/components/TipList'
import styles from './groceries.module.css'

export default function GroceriesPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 4"
        title="Planning groceries"
        subtitle={groceriesIntro}
      />
      <Link href="/guide/grocery-list" className={`${styles.progressLink} raised-sm`}>
        Open your grocery list →
      </Link>
      <TipList tips={groceryTips} />
    </div>
  )
}
