export type Cadence = 'weekly' | 'biweekly' | 'monthly' | 'as_needed'

/**
 * All date math here is UTC-based on purpose: dates are stored as plain
 * `date` columns (YYYY-MM-DD, no time/timezone), and "today" is computed
 * the same way wherever it's needed (reads and writes both run on the
 * server), so read/write always agree on what day it is. The one tradeoff
 * is that this is the server's calendar day, not necessarily the user's —
 * fine for a single-user app, worth revisiting if that ever changes.
 */
export function todayDateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

function parseDateUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function daysBetween(earlier: Date, later: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000)
}

function mondayOfWeek(date: Date): Date {
  const day = date.getUTCDay() // 0 = Sunday .. 6 = Saturday
  const daysSinceMonday = day === 0 ? 6 : day - 1
  const monday = new Date(date)
  monday.setUTCDate(date.getUTCDate() - daysSinceMonday)
  return monday
}

export function isWithinCadenceWindow(cadence: Cadence, entryDateStr: string, todayStr: string): boolean {
  const entry = parseDateUTC(entryDateStr)
  const today = parseDateUTC(todayStr)
  if (entry.getTime() > today.getTime()) return false

  switch (cadence) {
    case 'weekly':
      return entry.getTime() >= mondayOfWeek(today).getTime()
    case 'biweekly':
      return daysBetween(entry, today) <= 14
    case 'monthly':
      return entry.getUTCFullYear() === today.getUTCFullYear() && entry.getUTCMonth() === today.getUTCMonth()
    case 'as_needed':
      return daysBetween(entry, today) <= 7
  }
}

export function daysAgoLabel(entryDateStr: string, todayStr: string): string {
  const diff = daysBetween(parseDateUTC(entryDateStr), parseDateUTC(todayStr))
  if (diff <= 0) return 'today'
  if (diff === 1) return 'yesterday'
  return `${diff} days ago`
}
