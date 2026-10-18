'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { todayDateString, type Cadence } from '@/lib/habits'
import type { HabitColor } from '@/lib/habitColors'
import { isGroceryCategory, normalizeGroceryName, type GroceryCategory } from '@/lib/groceryCategories'
import { isDateString, isMealSlot, todayInLondon, type MealSlot } from '@/lib/mealPlan'
import { toMeal, type Meal } from '@/app/guide/meal-planner/data'

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
    })
    .select()
    .single()

  revalidatePath('/guide/grocery-list')
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

  revalidatePath('/guide/grocery-list')
  return { error: error?.message }
}

export async function clearPurchasedGroceries() {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('grocery_items')
    .delete()
    .eq('user_id', user.id)
    .eq('purchased', true)

  revalidatePath('/guide/grocery-list')
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

  revalidatePath('/guide/grocery-list')
  return { error: overrideError?.message }
}

export async function removeGroceryItem(itemId: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('grocery_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  revalidatePath('/guide/grocery-list')
  return { error: error?.message }
}

// ─── Meal planner ───────────────────────────────────────────────────────────

export interface MealIngredientInput {
  id?: string
  name: string
  quantity: string | null
  addToGroceries: boolean
  sortOrder: number
}

export interface MealInput {
  id?: string
  date: string
  slot: MealSlot
  name: string
  notes: string | null
  recipeKey: string | null
  ingredients: MealIngredientInput[]
}

const MEAL_COLUMNS =
  'id, plan_date, slot, name, notes, recipe_key, meal_ingredients(id, name, quantity, add_to_groceries, grocery_item_id, sort_order)'

/**
 * Save a meal into its day and slot (one meal per slot, so it upserts on
 * user + date + slot), then make its ingredient rows match the list given:
 * rows with an id are updated, rows without one are inserted, and rows no
 * longer in the list are deleted. Returns the saved meal with the ids of
 * any new ingredients.
 */
export async function saveMeal(input: MealInput): Promise<{ meal?: Meal; error?: string }> {
  const { supabase, user } = await requireUser()
  const name = input.name.trim()
  if (!isDateString(input.date) || !isMealSlot(input.slot)) return { error: 'Unknown day or meal' }
  if (!name) return { error: 'The meal needs a name' }

  const { data: meal, error } = await supabase
    .from('meal_plans')
    .upsert(
      {
        user_id: user.id,
        plan_date: input.date,
        slot: input.slot,
        name,
        notes: input.notes?.trim() || null,
        recipe_key: input.recipeKey,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,plan_date,slot' }
    )
    .select('id')
    .single()
  if (error) return { error: error.message }

  const { data: existing, error: existingError } = await supabase
    .from('meal_ingredients')
    .select('id')
    .eq('meal_id', meal.id)
    .eq('user_id', user.id)
  if (existingError) return { error: existingError.message }

  const existingIds = new Set((existing ?? []).map(r => r.id))
  const rows = input.ingredients
    .map(i => ({ ...i, name: i.name.trim(), quantity: i.quantity?.trim() || null }))
    .filter(i => i.name)
    .map((i, index) => ({
      id: i.id && existingIds.has(i.id) ? i.id : null,
      fields: {
        meal_id: meal.id,
        user_id: user.id,
        name: i.name,
        quantity: i.quantity,
        add_to_groceries: i.addToGroceries,
        sort_order: index,
      },
    }))
  const keptIds = new Set(rows.map(r => r.id))
  const removedIds = [...existingIds].filter(id => !keptIds.has(id))

  if (removedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('meal_ingredients')
      .delete()
      .in('id', removedIds)
      .eq('user_id', user.id)
    if (deleteError) return { error: deleteError.message }
  }

  const updates = rows.filter(r => r.id).map(r => ({ id: r.id, ...r.fields }))
  if (updates.length > 0) {
    const { error: updateError } = await supabase.from('meal_ingredients').upsert(updates, { onConflict: 'id' })
    if (updateError) return { error: updateError.message }
  }

  const inserts = rows.filter(r => !r.id).map(r => r.fields)
  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from('meal_ingredients').insert(inserts)
    if (insertError) return { error: insertError.message }
  }

  // Phase 14: grocery sync — add/update/remove the grocery rows linked to
  // this meal's ingredients (ticked ones on the list, unticked and removed
  // ones taken off), now that the ingredient rows match the card.

  const saved = await loadMeal(supabase, user.id, meal.id)
  revalidatePath('/guide/meal-planner')
  return saved
}

export async function deleteMeal(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser()

  // Phase 14: grocery sync — take this meal's linked quantities off the
  // grocery list before its ingredient rows are deleted with it.

  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/guide/meal-planner')
  return { error: error?.message }
}

/**
 * Copy a saved meal (name, notes, recipe and ingredients) into another day
 * and slot. If that slot already has a meal, nothing happens unless
 * `replace` is true: the answer says which meal is in the way, so the card
 * can ask first. Ingredients copied onto a past date come in unticked.
 */
export async function copyMeal(input: {
  fromId: string
  toDate: string
  toSlot: MealSlot
  replace: boolean
}): Promise<{ error?: string; conflict?: { name: string } }> {
  const { supabase, user } = await requireUser()
  if (!isDateString(input.toDate) || !isMealSlot(input.toSlot)) return { error: 'Unknown day or meal' }

  const source = await loadMeal(supabase, user.id, input.fromId)
  if (source.error || !source.meal) return { error: source.error ?? 'Meal not found' }
  if (source.meal.planDate === input.toDate && source.meal.slot === input.toSlot) {
    return { error: 'That’s this meal’s own slot' }
  }

  const { data: target, error: targetError } = await supabase
    .from('meal_plans')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('plan_date', input.toDate)
    .eq('slot', input.toSlot)
    .maybeSingle()
  if (targetError) return { error: targetError.message }

  if (target) {
    if (!input.replace) return { conflict: { name: target.name } }
    // Phase 14: grocery sync — the replaced meal's linked quantities come
    // off the grocery list here, as in deleteMeal.
    const { error: deleteError } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', target.id)
      .eq('user_id', user.id)
    if (deleteError) return { error: deleteError.message }
  }

  const { data: copy, error: copyError } = await supabase
    .from('meal_plans')
    .insert({
      user_id: user.id,
      plan_date: input.toDate,
      slot: input.toSlot,
      name: source.meal.name,
      notes: source.meal.notes,
      recipe_key: source.meal.recipeKey,
    })
    .select('id')
    .single()
  if (copyError) return { error: copyError.message }

  const isPast = input.toDate < todayInLondon()
  if (source.meal.ingredients.length > 0) {
    const { error: ingredientsError } = await supabase.from('meal_ingredients').insert(
      source.meal.ingredients.map((i, index) => ({
        meal_id: copy.id,
        user_id: user.id,
        name: i.name,
        quantity: i.quantity,
        add_to_groceries: isPast ? false : i.addToGroceries,
        sort_order: index,
      }))
    )
    if (ingredientsError) return { error: ingredientsError.message }
  }

  // Phase 14: grocery sync — put the copy's ticked ingredients on the list.

  revalidatePath('/guide/meal-planner')
  return {}
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
