import { recipes, type Bullet, type Recipe } from './content'
import { normalizeGroceryName, parseGroceryInput } from './groceryCategories'

/** "Bacon pasta (fan favorite)" → "Bacon pasta": the name a planned meal gets. */
export function recipeMealName(recipe: Recipe): string {
  return recipe.title.replace(/\s*\([^()]*\)\s*$/, '').trim()
}

export function findRecipe(key: string | null | undefined): Recipe | undefined {
  return key ? recipes.find(r => r.key === key) : undefined
}

/**
 * Recipes whose title has, for every word typed, a word starting with it —
 * "bol" → Bolognese, "eggs" → both egg recipes, "bacon pa" → Bacon pasta.
 * Both sides are normalised like grocery names (case, accents, punctuation).
 * Nothing until 2 characters have been typed.
 */
export function suggestRecipes(query: string, limit = 5): Recipe[] {
  const typed = normalizeGroceryName(query)
  if (typed.length < 2) return []
  const typedWords = typed.split(' ')
  return recipes
    .filter(r => {
      const titleWords = normalizeGroceryName(r.title).split(' ')
      return typedWords.every(t => titleWords.some(w => w.startsWith(t)))
    })
    .slice(0, limit)
}

export interface RecipeIngredient {
  name: string
  quantity: string | null
  /** False for the recipe's optional extras, which start unticked. */
  addToGroceries: boolean
}

const OPTIONAL_PREFIX = /^optional[^:]*:\s*/i

/**
 * A recipe's ingredient bullets as planner ingredients. "Optional: white wine"
 * becomes an unticked "white wine"; an "Optional additions:" heading
 * contributes its sub-bullets, unticked. Other sub-bullets are tips about the
 * line above ("Cheaper if frozen…"), so they're left out, as is "etc.".
 */
export function recipeIngredients(recipe: Recipe): RecipeIngredient[] {
  const out: RecipeIngredient[] = []
  const add = (text: string, addToGroceries: boolean) => {
    const cleaned = text.trim()
    if (!cleaned || /^etc\.?$/i.test(cleaned)) return
    const { name, quantity } = parseGroceryInput(cleaned)
    if (name) out.push({ name, quantity, addToGroceries })
  }

  recipe.ingredients.forEach((bullet: Bullet) => {
    if (OPTIONAL_PREFIX.test(bullet.text)) {
      add(bullet.text.replace(OPTIONAL_PREFIX, ''), false)
      bullet.children?.forEach(child => add(child.text, false))
    } else {
      add(bullet.text, true)
    }
  })
  return out
}
