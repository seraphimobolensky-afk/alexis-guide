import { createClient } from '@/lib/supabase/server'
import { MEAL_SLOTS, isMealSlot, type MealSlot } from '@/lib/mealPlan'

export interface GroceryItem {
  id: string
  name: string
  category: string | null
  quantity: string | null
  purchased: boolean
  purchasedAt: string | null
  createdAt: string
  /** The planned meals this item is for (date order), via meal_ingredients → meal_plans. */
  meals: { date: string; slot: MealSlot }[]
}

export interface GroceryPageData {
  items: GroceryItem[]
  /** Normalised item name → category the user moved it to before. */
  overrides: Record<string, string>
  loadError?: string
}

type MealRef = { plan_date: string; slot: string }

export async function getGroceryPageData(): Promise<GroceryPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { items: [], overrides: {} }

  const [itemsRes, overridesRes] = await Promise.all([
    supabase
      .from('grocery_items')
      .select('id, name, category, quantity, purchased, purchased_at, created_at, meal_ingredients(meal_plans(plan_date, slot))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase.from('grocery_category_overrides').select('term, category').eq('user_id', user.id),
  ])

  if (itemsRes.error) {
    console.error('getGroceryPageData: items fetch failed', itemsRes.error)
    return { items: [], overrides: {}, loadError: [itemsRes.error.code, itemsRes.error.message].filter(Boolean).join(' — ') }
  }
  // A missing overrides table (SQL not run yet) shouldn't take the list down
  // with it — the list just won't remember manual category moves.
  if (overridesRes.error) console.error('getGroceryPageData: overrides fetch failed', overridesRes.error)

  return {
    items: (itemsRes.data ?? []).map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      purchased: i.purchased,
      purchasedAt: i.purchased_at,
      createdAt: i.created_at,
      meals: mealRefs(i.meal_ingredients),
    })),
    overrides: Object.fromEntries((overridesRes.data ?? []).map(o => [o.term, o.category])),
  }
}

/** Distinct meals in date order, from the embedded links (to-one embeds may come back as arrays). */
function mealRefs(links: { meal_plans: MealRef | MealRef[] | null }[] | null): { date: string; slot: MealSlot }[] {
  const seen = new Map<string, { date: string; slot: MealSlot }>()
  for (const link of links ?? []) {
    const meal = Array.isArray(link.meal_plans) ? link.meal_plans[0] : link.meal_plans
    if (meal && isMealSlot(meal.slot)) seen.set(`${meal.plan_date}|${meal.slot}`, { date: meal.plan_date, slot: meal.slot })
  }
  return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date) || MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot))
}
