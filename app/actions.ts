'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { todayDateString, type Cadence } from '@/lib/habits'
import type { HabitColor } from '@/lib/habitColors'
import { isGroceryCategory, normalizeGroceryName, type GroceryCategory } from '@/lib/groceryCategories'

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
