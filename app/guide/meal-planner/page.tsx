import SectionHeader from '@/components/SectionHeader'
import MealPlanner from '@/components/MealPlanner'
import PageLinkButton from '@/components/PageLinkButton'
import { isDateString, isPlannerView, todayInLondon, visibleRange } from '@/lib/mealPlan'
import { getMealPlannerData } from './data'
import { getUserRecipes } from '../recipes/data'
import styles from './mealPlannerPage.module.css'

export default async function MealPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const today = todayInLondon()
  const view = isPlannerView(params.view) ? params.view : 'week'
  const date = isDateString(params.date) ? params.date : today

  const { start, end } = visibleRange(view, date)
  // Own recipes only feed the suggestions, so if they fail to load the planner still works.
  const [{ meals, loadError }, { recipes: myRecipes }] = await Promise.all([getMealPlannerData(start, end), getUserRecipes()])

  return (
    <div>
      <SectionHeader
        eyebrow="Food"
        title="Meal planner"
        subtitle="Plan breakfast, lunch and dinner for the days ahead."
      />
      <div className={styles.links}>
        <PageLinkButton href="/guide/grocery-list">Grocery list →</PageLinkButton>
      </div>
      <MealPlanner view={view} date={date} today={today} meals={meals} myRecipes={myRecipes} loadError={Boolean(loadError)} />
    </div>
  )
}
