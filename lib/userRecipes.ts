import type { Recipe } from './content'

/** A recipe Alexis added himself (table `user_recipes`). */
export interface UserRecipe {
  id: string
  title: string
  emoji: string
  intro: string | null
  ingredients: { name: string; quantity: string | null }[]
  steps: string[]
}

export type UserRecipeInput = Omit<UserRecipe, 'id'> & { id?: string }

export const DEFAULT_RECIPE_EMOJI = '🍽️'
export const RECIPE_LIMITS = { title: 120, emoji: 16, intro: 1000, ingredients: 100, ingredient: 200, steps: 50, step: 2000 }

/** Own recipes' keys can't clash with the guide's ones, which never start with this. */
const KEY_PREFIX = 'mine-'

export function userRecipeKey(id: string): string {
  return `${KEY_PREFIX}${id}`
}

export function isUserRecipeKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX)
}

/**
 * As a guide recipe, so the recipes page and the meal planner can treat both
 * alike. Each ingredient becomes "name (quantity)", which
 * `parseGroceryInput` splits back into the same name and quantity.
 */
export function userRecipeAsRecipe(r: UserRecipe): Recipe {
  return {
    key: userRecipeKey(r.id),
    title: r.title,
    emoji: r.emoji || DEFAULT_RECIPE_EMOJI,
    intro: r.intro ?? undefined,
    ingredients: r.ingredients.map(i => ({ text: i.quantity ? `${i.name} (${i.quantity})` : i.name })),
    steps: r.steps.map(text => ({ text })),
  }
}

// "• ", "- ", "* ", "▢ ", "1. ", "2) " at the start of a pasted line.
const LIST_MARKER = /^\s*(?:[-–—•*·▪▸►▢☐□✓✔]+\s*|\d+[.)]\s+)/
const SECTION_WORD = /^(?:ingredients|method|steps|directions|instructions|preparation)\s*:?$/i

function pastedLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(line => line.replace(LIST_MARKER, '').replace(/\s+/g, ' ').trim())
    .filter(line => line && !SECTION_WORD.test(line))
}

/**
 * A pasted ingredient list as one ingredient per line: list markers and
 * numbering stripped, blank lines and headings ("Ingredients", "For the
 * sauce:") dropped.
 */
export function splitIngredientLines(text: string): string[] {
  return pastedLines(text).filter(line => !line.endsWith(':'))
}

/** Steps typed or pasted one per line, numbering stripped. "Method" headings go; "Then:" lines stay. */
export function splitStepLines(text: string): string[] {
  return pastedLines(text)
}
