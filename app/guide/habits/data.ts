import { createClient } from '@/lib/supabase/server'
import type { Cadence } from '@/lib/habits'
import { defaultHabitColor, isHabitColor, type HabitColor } from '@/lib/habitColors'

export type ValueType = 'boolean' | 'number' | 'percent'
export type HabitGroup = 'cleaning' | 'custom'

export interface HabitRecord {
  id: string
  key: string
  label: string
  icon: string | null
  valueType: ValueType
  unit: string | null
  target: number | null
  cadence: Cadence
  group: HabitGroup
  sortOrder: number
  color: HabitColor
}

export interface EntryRecord {
  habitId: string
  entryDate: string
  valueBool: boolean | null
  valueNum: number | null
  valuePct: number | null
}

export interface HabitsPageData {
  cleaningHabits: HabitRecord[]
  customHabits: HabitRecord[]
  entriesByHabit: Record<string, EntryRecord[]>
}

interface HabitRow {
  id: string
  key: string
  label: string
  icon: string | null
  value_type: ValueType
  unit: string | null
  target: number | null
  cadence: Cadence
  group: HabitGroup
  sort_order: number
  color?: string | null
}

const MAX_RANGE_DAYS = 90

function daysAgoDateString(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function getHabitsPageData(): Promise<HabitsPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { cleaningHabits: [], customHabits: [], entriesByHabit: {} }

  const baseColumns = 'id, key, label, icon, value_type, unit, target, cadence, group, sort_order'
  const fetchHabits = (columns: string) =>
    supabase
      .from('habits')
      .select(columns)
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .returns<HabitRow[]>()

  let { data: habitsRaw, error: habitsError } = await fetchHabits(`${baseColumns}, color`)
  // 42703 = undefined column: the `color` migration hasn't been run yet, so
  // fall back to default colours rather than breaking the whole page.
  if (habitsError?.code === '42703') {
    ;({ data: habitsRaw, error: habitsError } = await fetchHabits(baseColumns))
  }
  if (habitsError) console.error('getHabitsPageData: habits fetch failed', habitsError)

  const indexInGroup: Record<string, number> = {}
  const habits: HabitRecord[] = (habitsRaw ?? []).map(h => {
    const index = (indexInGroup[h.group] = (indexInGroup[h.group] ?? -1) + 1)
    return {
    id: h.id,
    key: h.key,
    label: h.label,
    icon: h.icon,
    valueType: h.value_type,
    unit: h.unit,
    target: h.target,
    cadence: h.cadence,
    group: h.group,
    sortOrder: h.sort_order,
    color: isHabitColor(h.color) ? h.color : defaultHabitColor(index),
  }})

  const habitIds = habits.map(h => h.id)
  const cutoff = daysAgoDateString(MAX_RANGE_DAYS)

  const { data: entriesRaw } = habitIds.length
    ? await supabase
        .from('habit_entries')
        .select('habit_id, entry_date, value_bool, value_num, value_pct')
        .eq('user_id', user.id)
        .in('habit_id', habitIds)
        .gte('entry_date', cutoff)
        .order('entry_date', { ascending: true })
    : { data: [] as { habit_id: string; entry_date: string; value_bool: boolean | null; value_num: number | null; value_pct: number | null }[] }

  const entriesByHabit: Record<string, EntryRecord[]> = {}
  entriesRaw?.forEach(e => {
    const list = entriesByHabit[e.habit_id] ?? []
    list.push({
      habitId: e.habit_id,
      entryDate: e.entry_date,
      valueBool: e.value_bool,
      valueNum: e.value_num,
      valuePct: e.value_pct,
    })
    entriesByHabit[e.habit_id] = list
  })

  return {
    cleaningHabits: habits.filter(h => h.group === 'cleaning'),
    customHabits: habits.filter(h => h.group === 'custom'),
    entriesByHabit,
  }
}
