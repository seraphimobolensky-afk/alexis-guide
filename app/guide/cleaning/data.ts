import { createClient } from '@/lib/supabase/server'
import { cleaningTasks } from '@/lib/content'
import { isWithinCadenceWindow, daysAgoLabel, todayDateString, type Cadence } from '@/lib/habits'

export interface CleaningHabitStatus {
  habitId: string
  doneToday: boolean
  doneInWindow: boolean
  lastDoneLabel: string | null
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function ensureCleaningHabitsSeeded(supabase: SupabaseServerClient, userId: string) {
  const { count } = await supabase
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('group', 'cleaning')

  if (count && count > 0) return

  const rows = cleaningTasks.map((task, index) => ({
    user_id: userId,
    key: task.key,
    label: task.title,
    icon: task.icon,
    value_type: 'boolean' as const,
    cadence: task.cadence,
    group: 'cleaning' as const,
    sort_order: index,
  }))

  await supabase.from('habits').insert(rows)
}

export async function getCleaningHabitStatuses(): Promise<Record<string, CleaningHabitStatus>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  await ensureCleaningHabitsSeeded(supabase, user.id)

  const { data: habits } = await supabase
    .from('habits')
    .select('id, key, cadence')
    .eq('user_id', user.id)
    .eq('group', 'cleaning')
    .eq('archived', false)

  const habitByKey = new Map((habits ?? []).map(h => [h.key, h]))
  const habitIds = (habits ?? []).map(h => h.id)

  const { data: entries } = habitIds.length
    ? await supabase
        .from('habit_entries')
        .select('habit_id, entry_date')
        .eq('user_id', user.id)
        .in('habit_id', habitIds)
        .order('entry_date', { ascending: false })
    : { data: [] as { habit_id: string; entry_date: string }[] }

  const datesByHabit = new Map<string, string[]>()
  entries?.forEach(entry => {
    const dates = datesByHabit.get(entry.habit_id) ?? []
    dates.push(entry.entry_date)
    datesByHabit.set(entry.habit_id, dates)
  })

  const today = todayDateString()
  const statuses: Record<string, CleaningHabitStatus> = {}

  for (const task of cleaningTasks) {
    const habit = habitByKey.get(task.key)
    if (!habit) continue

    const dates = datesByHabit.get(habit.id) ?? [] // already sorted newest-first
    const doneToday = dates.includes(today)
    const doneInWindow = dates.some(date => isWithinCadenceWindow(habit.cadence as Cadence, date, today))
    const lastDoneLabel = dates.length > 0 ? daysAgoLabel(dates[0], today) : null

    statuses[task.key] = { habitId: habit.id, doneToday, doneInWindow, lastDoneLabel }
  }

  return statuses
}
