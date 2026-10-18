import SectionHeader from '@/components/SectionHeader'
import GroceryList from '@/components/GroceryList'
import PageLinkButton from '@/components/PageLinkButton'
import { todayInLondon } from '@/lib/mealPlan'
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
      <div className={styles.links}>
        <PageLinkButton href="/guide/groceries">Tips for planning groceries →</PageLinkButton>
        <PageLinkButton href="/guide/meal-planner">Meal planner →</PageLinkButton>
      </div>
      {loadError ? (
        <p className={styles.loadError}>
          Couldn’t load your grocery list right now. Try reloading the page in a moment.
        </p>
      ) : (
        <GroceryList items={items} overrides={overrides} today={todayInLondon()} />
      )}
    </div>
  )
}
