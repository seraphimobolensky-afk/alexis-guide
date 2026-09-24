import Link from 'next/link'
import SectionHeader from '@/components/SectionHeader'
import GroceryList from '@/components/GroceryList'
import { getGroceryPageData } from './data'
import styles from './groceryList.module.css'

export default async function GroceryListPage() {
  const { items, overrides, loadError } = await getGroceryPageData()

  return (
    <div>
      <SectionHeader
        eyebrow="Food"
        title="Grocery list"
        subtitle="Type what you need — it sorts itself into aisles. Tap an item once it’s in the basket."
      />
      <Link href="/guide/groceries" className={styles.tipsLink}>
        Tips for planning groceries →
      </Link>
      {loadError ? (
        <p className={styles.loadError}>
          Couldn’t load your grocery list right now. Try reloading the page in a moment.
        </p>
      ) : (
        <GroceryList items={items} overrides={overrides} />
      )}
    </div>
  )
}
