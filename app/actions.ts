'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { todayDateString, type Cadence } from '@/lib/habits'
import type { HabitColor } from '@/lib/habitColors'
import { isGroceryCategory, normalizeGroceryName, type GroceryCategory } from '@/lib/groceryCategories'
import { isDateString, isMealSlot, todayInLondon, type MealSlot } from '@/lib/mealPlan'
import { toMeal, type Meal } from '@/app/guide/meal-planner/data'
import type { GroceryChoice, MealInput } from '@/lib/mealGroceryRules'
import { copyMealWithGroceries, deleteMealWithGroceries, saveMealWithGroceries } from '@/lib/mealGrocerySync'
import { supabasePlannerStore } from '@/lib/mealGroceryStore'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  return { supabase, user }
}

// ─── Habits ───────────────────────────────────────────────────────────────

export async function logHabitEntry(input: {
  habitId: string
  entryDate?: string
  valueBool?: boolean
  valueNum?: number
  valuePct?: number
}) {
  const { supabase, user } = await requireUser()
  const entryDate = input.entryDate ?? todayDateString()

  const { error } = await supabase.from('habit_entries').upsert(
    {
      habit_id: input.habitId,
      user_id: user.id,
      entry_date: entryDate,
      value_bool: input.valueBool ?? true,
      value_num: input.valueNum ?? null,
      value_pct: input.valuePct ?? null,
    },
    { onConflict: 'habit_id,entry_date' }
  )

  revalidatePath('/guide/cleaning')
  revalidatePath('/guide/habits')
  return { error: error?.message }
}

export async function removeHabitEntry(input: { habitId: string; entryDate?: string }) {
  const { supabase, user } = await requireUser()
  const entryDate = input.entryDate ?? todayDateString()

  const { error } = await supabase
    .from('habit_entries')
    .delete()
    .eq('habit_id', input.habitId)
    .eq('user_id', user.id)
    .eq('entry_date', entryDate)

  revalidatePath('/guide/cleaning')
  revalidatePath('/guide/habits')
  return { error: error?.message }
}

export async function addHabit(input: {
  key: string
  label: string
  icon?: string
  valueType?: 'boolean' | 'number' | 'percent'
  unit?: string
  target?: number
  cadence?: Cadence
  group?: 'cleaning' | 'custom'
  sortOrder?: number
  color?: HabitColor
}) {
  const { supabase, user } = await requireUser()

  const insertHabit = (row: Record<string, unknown>) => supabase.from('habits').insert(row).select().single()

  const row = {
    user_id: user.id,
    key: input.key,
    label: input.label,
    icon: input.icon ?? null,
    value_type: input.valueType ?? 'boolean',
    unit: input.unit ?? null,
    target: input.target ?? null,
    cadence: input.cadence ?? 'weekly',
    group: input.group ?? 'custom',
    sort_order: input.sortOrder ?? 0,
  }
  let { data, error } = await insertHabit(input.color ? { ...row, color: input.color } : row)
  // 42703 = the `color` column doesn't exist yet (migration not run) — save
  // without it; the habit just gets its default colour.
  if (error?.code === '42703') ({ data, error } = await insertHabit(row))

  revalidatePath('/guide/cleaning')
  revalidatePath('/guide/habits')
  return { data, error: error?.message }
}

export async function updateHabit(habitId: string, input: {
  label?: string
  icon?: string
  unit?: string
  target?: number | null
  cadence?: Cadence
  color?: HabitColor
}) {
  const { supabase, user } = await requireUser()

  const patch: Record<string, unknown> = {}
  if (input.label !== undefined) patch.label = input.label
  if (input.icon !== undefined) patch.icon = input.icon || null
  if (input.unit !== undefined) patch.unit = input.unit || null
  if (input.target !== undefined) patch.target = input.target
  if (input.cadence !== undefined) patch.cadence = input.cadence
  if (input.color !== undefined) patch.color = input.color

  const { error } = await supabase
    .from('habits')
    .update(patch)
    .eq('id', habitId)
    .eq('user_id', user.id)

  revalidatePath('/guide/cleaning')
  revalidatePath('/guide/habits')
  return { error: error?.message }
}

export async function archiveHabit(habitId: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('habits')
    .update({ archived: true })
    .eq('id', habitId)
    .eq('user_id', user.id)

  revalidatePath('/guide/cleaning')
  revalidatePath('/guide/habits')
  return { error: error?.message }
}

// Hard delete — permanently removes the habit and (via ON DELETE CASCADE)
// all of its logged entries. The UI must confirm with the user before
// calling this; archiving is the reversible, history-preserving option.
export async function deleteHabit(habitId: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', user.id)

  revalidatePath('/guide/cleaning')
  revalidatePath('/guide/habits')
  return { error: error?.message }
}

// ─── Grocery list ───────────────────────────────────────────────────────────

export async function addGroceryItem(input: { name: string; category?: string; quantity?: string }) {
  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('grocery_items')
    .insert({
      user_id: user.id,
      name: input.name,
      category: input.category ?? null,
      quantity: input.quantity ?? null,
      // Typed by hand: its own row, never merged into a planner one. The base
      // is what he typed, so meals can add their share on top later.
      origin: 'manual',
      base_quantity: input.quantity ?? null,
    })
    .select()
    .single()

  revalidateFood()
  return { data, error: error?.message }
}

export async function toggleGroceryPurchased(itemId: string, purchased: boolean) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('grocery_items')
    .update({
      purchased,
      purchased_at: purchased ? new Date().toISOString() : null,
    })
    .eq('id', itemId)
    .eq('user_id', user.id)

  revalidateFood()
  return { error: error?.message }
}

export async function clearPurchasedGroceries() {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('grocery_items')
    .delete()
    .eq('user_id', user.id)
    .eq('purchased', true)

  revalidateFood()
  return { error: error?.message }
}

/**
 * Move an item to a different category, and remember that choice for its
 * name so the same item lands there automatically next time.
 */
export async function setGroceryCategory(itemId: string, name: string, category: GroceryCategory) {
  const { supabase, user } = await requireUser()
  if (!isGroceryCategory(category)) return { error: 'Unknown category' }

  const { error } = await supabase
    .from('grocery_items')
    .update({ category })
    .eq('id', itemId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  const { error: overrideError } = await supabase
    .from('grocery_category_overrides')
    .upsert(
      { user_id: user.id, term: normalizeGroceryName(name), category, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,term' }
    )

  revalidateFood()
  return { error: overrideError?.message }
}

export async function removeGroceryItem(itemId: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('grocery_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  revalidateFood()
  return { error: error?.message }
}

// ─── Meal planner ───────────────────────────────────────────────────────────
// The grocery-list side of these lives in lib/mealGrocerySync.ts.

export type { MealInput, MealIngredientInput, GroceryChoice } from '@/lib/mealGroceryRules'

const MEAL_COLUMNS =
  'id, plan_date, slot, name, notes, recipe_key, meal_ingredients(id, name, quantity, add_to_groceries, grocery_item_id, sort_order, grocery_items(name, purchased))'

/** Both pages show meal ↔ grocery links, so anything that changes one refreshes both. */
function revalidateFood() {
  revalidatePath('/guide/meal-planner')
  revalidatePath('/guide/grocery-list')
}

/**
 * Save a meal into its day and slot, make its ingredient rows match, and feed
 * the grocery list (see `saveMealWithGroceries`). Returns the saved meal so
 * the card can adopt new ingredient ids and grocery links.
 */
export async function saveMeal(input: MealInput): Promise<{ meal?: Meal; error?: string }> {
  const { supabase, user } = await requireUser()
  if (!isDateString(input.date) || !isMealSlot(input.slot)) return { error: 'Unknown day or meal' }
  if (!input.name.trim()) return { error: 'The meal needs a name' }

  try {
    const mealId = await saveMealWithGroceries(supabasePlannerStore(supabase, user.id), input)
    const saved = await loadMeal(supabase, user.id, mealId)
    revalidateFood()
    return saved
  } catch (e) {
    revalidateFood()
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

/** Delete a meal. `groceryChoice` says what happens to the grocery rows it feeds. */
export async function deleteMeal(id: string, groceryChoice: GroceryChoice = 'keep'): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser()
  try {
    await deleteMealWithGroceries(supabasePlannerStore(supabase, user.id), id, groceryChoice)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  } finally {
    revalidateFood()
  }
}

/**
 * Copy a saved meal into another day and slot. If that slot already has a
 * meal, nothing happens unless `replace` is true: the answer says which meal
 * is in the way, so the card can ask first. The copy's ticked ingredients go
 * on the grocery list (unticked when copied onto a past date).
 */
export async function copyMeal(input: {
  fromId: string
  toDate: string
  toSlot: MealSlot
  replace: boolean
}): Promise<{ error?: string; conflict?: { name: string } }> {
  const { supabase, user } = await requireUser()
  if (!isDateString(input.toDate) || !isMealSlot(input.toSlot)) return { error: 'Unknown day or meal' }
  try {
    const res = await copyMealWithGroceries(supabasePlannerStore(supabase, user.id), { ...input, today: todayInLondon() })
    if (!res.conflict) revalidateFood()
    return res
  } catch (e) {
    revalidateFood()
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

async function loadMeal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  id: string
): Promise<{ meal?: Meal; error?: string }> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select(MEAL_COLUMNS)
    .eq('id', id)
    .eq('user_id', userId)
    .order('sort_order', { referencedTable: 'meal_ingredients', ascending: true })
    .single()
  if (error) return { error: error.message }
  return { meal: toMeal(data) }
}
