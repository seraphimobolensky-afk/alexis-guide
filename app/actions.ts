'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { todayDateString, type Cadence } from '@/lib/habits'

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
}) {
  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('habits')
    .insert({
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
    })
    .select()
    .single()

  revalidatePath('/guide/cleaning')
  return { data, error: error?.message }
}

export async function archiveHabit(habitId: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('habits')
    .update({ archived: true })
    .eq('id', habitId)
    .eq('user_id', user.id)

  revalidatePath('/guide/cleaning')
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
