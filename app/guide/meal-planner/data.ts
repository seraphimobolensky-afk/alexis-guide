import { createClient } from '@/lib/supabase/server'
import { isMealSlot, type MealSlot } from '@/lib/mealPlan'

export interface MealIngredient {
  id: string
  name: string
  quantity: string | null
  addToGroceries: boolean
  groceryItemId: string | null
  /** The grocery row it feeds, if it's linked: its name, and whether it's been bought. */
  grocery: { name: string; purchased: boolean } | null
  sortOrder: number
}

export interface Meal {
  id: string
  planDate: string
  slot: MealSlot
  name: string
  notes: string | null
  recipeKey: string | null
  ingredients: MealIngredient[]
}

export interface MealPlannerData {
  meals: Meal[]
  loadError?: string
}

/** The signed-in user's meals from `start` to `end` (inclusive, YYYY-MM-DD). */
export async function getMealPlannerData(start: string, end: string): Promise<MealPlannerData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { meals: [] }

  const { data, error } = await supabase
    .from('meal_plans')
    .select(
      'id, plan_date, slot, name, notes, recipe_key, meal_ingredients(id, name, quantity, add_to_groceries, grocery_item_id, sort_order, grocery_items(name, purchased))'
    )
    .eq('user_id', user.id)
    .gte('plan_date', start)
    .lte('plan_date', end)
    .order('plan_date', { ascending: true })
    .order('sort_order', { referencedTable: 'meal_ingredients', ascending: true })

  if (error) {
    console.error('getMealPlannerData: meals fetch failed', error)
    return { meals: [], loadError: [error.code, error.message].filter(Boolean).join(' — ') }
  }

  return { meals: (data ?? []).filter(m => isMealSlot(m.slot)).map(toMeal) }
}

interface MealRow {
  id: string
  plan_date: string
  slot: string
  name: string
  notes: string | null
  recipe_key: string | null
  meal_ingredients: {
    id: string
    name: string
    quantity: string | null
    add_to_groceries: boolean
    grocery_item_id: string | null
    sort_order: number
    // A to-one embed, which the untyped client reports as an array.
    grocery_items: { name: string; purchased: boolean } | { name: string; purchased: boolean }[] | null
  }[] | null
}

/** A `meal_plans` row with its embedded `meal_ingredients` → a Meal. */
export function toMeal(m: MealRow): Meal {
  return {
    id: m.id,
    planDate: m.plan_date,
    slot: m.slot as MealSlot,
    name: m.name,
    notes: m.notes,
    recipeKey: m.recipe_key,
    ingredients: (m.meal_ingredients ?? []).map(i => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      addToGroceries: i.add_to_groceries,
      groceryItemId: i.grocery_item_id,
      grocery: (Array.isArray(i.grocery_items) ? i.grocery_items[0] : i.grocery_items) ?? null,
      sortOrder: i.sort_order,
    })),
  }
}
