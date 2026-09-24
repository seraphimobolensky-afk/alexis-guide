import { createClient } from '@/lib/supabase/server'
import { cleaningTasks } from '@/lib/content'
import { isWithinCadenceWindow, daysAgoLabel, todayDateString, type Cadence } from '@/lib/habits'

export interface CleaningHabitStatus {
  habitId: string
  doneToday: boolean
  doneInWindow: boolean
  lastDoneLabel: string | null
}

export interface CleaningStatusResult {
  statuses: Record<string, CleaningHabitStatus>
  /** Set when loading failed; logged server-side (Vercel logs), not shown to the user. */
  debugError?: string
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

// Head-only requests (like the count query) get no response body back, so a
// failure there arrives with an empty `message` — include the code/status too
// so the debug line is never blank.
function describeError(error: { message?: string; code?: string; details?: string }): string {
  return [error.code, error.message, error.details].filter(Boolean).join(' — ') || 'unknown error (no message returned)'
}

/** Creates the 11 cleaning habits for a user who doesn't have them yet. Safe to call on every request. */
export async function ensureCleaningHabitsSeeded(supabase: SupabaseServerClient, userId: string): Promise<string | null> {
  const { count, error: countError } = await supabase
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('group', 'cleaning')

  if (countError) {
    console.error('ensureCleaningHabitsSeeded: count query failed', countError)
    return `seed-count: ${describeError(countError)}`
  }
  if (count && count > 0) return null

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

  const { error: insertError } = await supabase.from('habits').insert(rows)
  if (insertError) {
    console.error('ensureCleaningHabitsSeeded: insert failed', insertError)
    return `seed-insert: ${describeError(insertError)}`
  }
  return null
}

export async function getCleaningHabitStatuses(): Promise<CleaningStatusResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { statuses: {} }

  const seedError = await ensureCleaningHabitsSeeded(supabase, user.id)
  if (seedError) return { statuses: {}, debugError: seedError }

  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, key, cadence')
    .eq('user_id', user.id)
    .eq('group', 'cleaning')
    .eq('archived', false)

  if (habitsError) {
    console.error('getCleaningHabitStatuses: habits fetch failed', habitsError)
    return { statuses: {}, debugError: `habits-fetch: ${describeError(habitsError)}` }
  }

  const habitByKey = new Map((habits ?? []).map(h => [h.key, h]))
  const habitIds = (habits ?? []).map(h => h.id)

  const { data: entries, error: entriesError } = habitIds.length
    ? await supabase
        .from('habit_entries')
        .select('habit_id, entry_date')
        .eq('user_id', user.id)
        .in('habit_id', habitIds)
        .order('entry_date', { ascending: false })
    : { data: [] as { habit_id: string; entry_date: string }[], error: null }

  if (entriesError) {
    console.error('getCleaningHabitStatuses: entries fetch failed', entriesError)
    return { statuses: {}, debugError: `entries-fetch: ${describeError(entriesError)}` }
  }

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

  return { statuses }
}
