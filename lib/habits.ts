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

export type RangeDays = 7 | 30 | 90

/** Every calendar date in the range, oldest first, ending today (inclusive). */
export function rangeDates(days: RangeDays, todayStr: string = todayDateString()): string[] {
  const today = parseDateUTC(todayStr)
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

/** A short, human date label for chart axes — "Sep 20", not the raw ISO string. */
export function formatShortDate(dateStr: string): string {
  const date = parseDateUTC(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/**
 * A thinned-out subset of `dates` to use as explicit axis ticks, so a
 * 90-day range doesn't try to cram 90 labels into a 360px-wide screen.
 * Always keeps the first and last date.
 */
export function pickTickDates(dates: string[], maxTicks: number): string[] {
  if (dates.length <= maxTicks) return dates
  const step = Math.ceil(dates.length / maxTicks)
  const ticks = dates.filter((_, i) => i % step === 0)
  const last = dates[dates.length - 1]
  if (ticks[ticks.length - 1] !== last) ticks.push(last)
  return ticks
}
