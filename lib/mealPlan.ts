/**
 * Date helpers for the meal planner.
 *
 * Every date here is a date-only string, YYYY-MM-DD, in Alexis's own
 * calendar (Europe/London). Maths is done on Dates set to 12:00 UTC, so
 * adding days or formatting can never tip a date over midnight into the
 * day before or after, whatever time zone the code runs in.
 *
 * Deliberately separate from `todayDateString` in lib/habits.ts, which is
 * UTC-based (habits depend on that, so it stays as it is).
 */

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'] as const
export type MealSlot = (typeof MEAL_SLOTS)[number]

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

export const PLANNER_VIEWS = ['day', 'week', 'month'] as const
export type PlannerView = (typeof PLANNER_VIEWS)[number]

export const PLANNER_TIME_ZONE = 'Europe/London'

export function isPlannerView(value: unknown): value is PlannerView {
  return typeof value === 'string' && (PLANNER_VIEWS as readonly string[]).includes(value)
}

export function isMealSlot(value: unknown): value is MealSlot {
  return typeof value === 'string' && (MEAL_SLOTS as readonly string[]).includes(value)
}

/** True for a real calendar date written as YYYY-MM-DD ("2026-02-30" is false). */
export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return toDateString(parseDate(value)) === value
}

/** Today's date in London, wherever this runs (Vercel's servers are on UTC). */
export function todayInLondon(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PLANNER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** YYYY-MM-DD → a Date at 12:00 UTC on that day. */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12))
}

/** A Date from `parseDate` (or any UTC-noon Date) → YYYY-MM-DD. */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr)
  date.setUTCDate(date.getUTCDate() + days)
  return toDateString(date)
}

export function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7)
}

/** Same day-of-month, clamped to the end of shorter months (31 Jan + 1 → 28/29 Feb). */
export function addMonths(dateStr: string, months: number): string {
  const date = parseDate(dateStr)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).getUTCDate()
  date.setUTCDate(Math.min(day, lastDay))
  return toDateString(date)
}

/** The Monday on or before this date. */
export function startOfWeek(dateStr: string): string {
  const day = parseDate(dateStr).getUTCDay() // 0 = Sunday .. 6 = Saturday
  return addDays(dateStr, day === 0 ? -6 : 1 - day)
}

export function startOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`
}

/** Seven dates, Monday to Sunday, for the week containing this date. */
export function weekDates(dateStr: string): string[] {
  const monday = startOfWeek(dateStr)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** 42 dates (six Monday-first weeks) covering the month containing this date. */
export function monthGridDates(dateStr: string): string[] {
  const first = startOfWeek(startOfMonth(dateStr))
  return Array.from({ length: 42 }, (_, i) => addDays(first, i))
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** The first and last date the given view shows (inclusive). */
export function visibleRange(view: PlannerView, dateStr: string): { start: string; end: string } {
  if (view === 'day') return { start: dateStr, end: dateStr }
  const dates = view === 'week' ? weekDates(dateStr) : monthGridDates(dateStr)
  return { start: dates[0], end: dates[dates.length - 1] }
}

/** Where ‹ / › go from here: one day, week or month back or forward. */
export function stepDate(view: PlannerView, dateStr: string, direction: -1 | 1): string {
  if (view === 'day') return addDays(dateStr, direction)
  if (view === 'week') return addWeeks(dateStr, direction)
  return addMonths(dateStr, direction)
}

// ─── Display ─────────────────────────────────────────────────────────────────
// The Dates being formatted are UTC noon, so the formatters use UTC too.

function formatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options })
}

const weekdayLong = formatter({ weekday: 'long' })
const weekdayShort = formatter({ weekday: 'short' })
const dayMonthLong = formatter({ weekday: 'long', day: 'numeric', month: 'long' })
const dayMonthYearLong = formatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const monthShort = formatter({ month: 'short' })
const monthYearLong = formatter({ month: 'long', year: 'numeric' })

/** "Monday" */
export function formatWeekday(dateStr: string): string {
  return weekdayLong.format(parseDate(dateStr))
}

/** "Mon" */
export function formatWeekdayShort(dateStr: string): string {
  return weekdayShort.format(parseDate(dateStr))
}

/** "19" */
export function formatDayNumber(dateStr: string): string {
  return String(Number(dateStr.slice(8, 10)))
}

/** "19 Oct" */
export function formatDayMonthShort(dateStr: string): string {
  return `${formatDayNumber(dateStr)} ${monthShort.format(parseDate(dateStr))}`
}

/** "Monday 19 October" — used in headings and accessible labels. */
export function formatDayLong(dateStr: string): string {
  return dayMonthLong.format(parseDate(dateStr)).replace(',', '')
}

/** "October 2026" */
export function formatMonthYear(dateStr: string): string {
  return monthYearLong.format(parseDate(dateStr))
}

/**
 * The toolbar title for a view:
 * day   → "Wednesday 21 October" (with the year if it isn't this year)
 * week  → "Mon 19 – Sun 25 Oct 2026", "Mon 26 Oct – Sun 1 Nov 2026",
 *         "Mon 28 Dec 2026 – Sun 3 Jan 2027"
 * month → "October 2026"
 */
export function formatRangeTitle(view: PlannerView, dateStr: string, today: string): string {
  if (view === 'day') {
    const sameYear = dateStr.slice(0, 4) === today.slice(0, 4)
    return (sameYear ? dayMonthLong : dayMonthYearLong).format(parseDate(dateStr)).replace(',', '')
  }
  if (view === 'month') return formatMonthYear(dateStr)

  const dates = weekDates(dateStr)
  const start = dates[0]
  const end = dates[6]
  const startYear = start.slice(0, 4)
  const endYear = end.slice(0, 4)
  const endText = `${formatWeekdayShort(end)} ${formatDayMonthShort(end)} ${endYear}`
  if (startYear !== endYear) {
    return `${formatWeekdayShort(start)} ${formatDayMonthShort(start)} ${startYear} – ${endText}`
  }
  if (!isSameMonth(start, end)) {
    return `${formatWeekdayShort(start)} ${formatDayMonthShort(start)} – ${endText}`
  }
  return `${formatWeekdayShort(start)} ${formatDayNumber(start)} – ${endText}`
}
