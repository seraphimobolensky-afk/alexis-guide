import SectionHeader from '@/components/SectionHeader'
import RecipeList from '@/components/RecipeList'
import { getUserRecipes } from './data'
import styles from './recipesPage.module.css'

/** `?open=<recipe key>` (the meal planner's "View recipe" link) opens that recipe and scrolls to it. */
export default async function RecipesPage({ searchParams }: { searchParams: Promise<{ open?: string | string[] }> }) {
  const { open } = await searchParams
  const { recipes, loadError } = await getUserRecipes()

  return (
    <div>
      <SectionHeader
        eyebrow="Section 5"
        title="Easy recipes that I like"
      />
      {loadError && (
        <p className={styles.loadError}>
          Couldn’t load your own recipes right now. Try reloading the page in a moment.
        </p>
      )}
      <RecipeList myRecipes={recipes} openKey={typeof open === 'string' ? open : undefined} />
    </div>
  )
}
