/**
 * The meal ↔ grocery rules that both the meal card (to decide whether to
 * ask) and the server (to decide what to do) need, so they always agree.
 * No database access here; see lib/mealGrocerySync.ts for that.
 */
import { normalizeGroceryName } from './groceryCategories'
import type { MealSlot } from './mealPlan'

/** What to do with grocery rows an edit takes this meal's share off. */
export type GroceryChoice = 'remove' | 'keep'

export interface MealIngredientInput {
  id?: string
  name: string
  quantity: string | null
  addToGroceries: boolean
  sortOrder: number
  /** Put a ticked ingredient back on the list after its grocery row was removed by hand. */
  relink?: boolean
}

export interface MealInput {
  id?: string
  date: string
  slot: MealSlot
  name: string
  notes: string | null
  recipeKey: string | null
  ingredients: MealIngredientInput[]
  /** Only needed when the save takes linked ingredients off the list (see `ingredientsTakenOff`). */
  groceryChoice?: GroceryChoice
}

/** "2", null, " ", "3" → "2 + 3"; nothing left → null. */
export function joinQuantities(parts: (string | null | undefined)[]): string | null {
  const kept = parts.map(p => p?.trim()).filter((p): p is string => Boolean(p))
  return kept.length > 0 ? kept.join(' + ') : null
}

/** A saved ingredient as far as the grocery link is concerned. */
export interface LinkedIngredient {
  id: string
  name: string
  addToGroceries: boolean
  groceryItemId: string | null
}

/**
 * Which saved, linked ingredients an edit takes off the grocery list: removed
 * from the meal, unticked, or renamed to something else (which links the new
 * name afresh). `after` is the meal's ingredient list as it will be saved.
 */
export function ingredientsTakenOff(
  before: LinkedIngredient[],
  after: { id?: string; name: string; addToGroceries: boolean }[]
): LinkedIngredient[] {
  const afterById = new Map(after.filter(a => a.id).map(a => [a.id!, a]))
  return before.filter(b => {
    if (!b.groceryItemId) return false
    const a = afterById.get(b.id)
    return !a || !a.addToGroceries || normalizeGroceryName(a.name) !== normalizeGroceryName(b.name)
  })
}
