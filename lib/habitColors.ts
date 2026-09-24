/**
 * Fixed categorical palette for habit charts. The order matters: it's the
 * order that passed the colourblind-separation checks, so defaults are handed
 * out in this order. Hex values live in globals.css (per theme) as
 * `--habit-<name>` so the charts follow the light/dark toggle automatically.
 */
export const HABIT_COLORS = ['blue', 'orange', 'aqua', 'yellow', 'magenta', 'green', 'violet', 'red'] as const

export type HabitColor = (typeof HABIT_COLORS)[number]

/** Most lines a combined chart shows at once — past this, colours repeat. */
export const MAX_COMBINED_SERIES = HABIT_COLORS.length

export function isHabitColor(value: unknown): value is HabitColor {
  return typeof value === 'string' && (HABIT_COLORS as readonly string[]).includes(value)
}

export function habitColorVar(color: HabitColor): string {
  return `var(--habit-${color})`
}

/** Default for a habit with no saved colour, based on its position in its group. */
export function defaultHabitColor(index: number): HabitColor {
  return HABIT_COLORS[index % HABIT_COLORS.length]
}

/** First palette colour not already used in the group (for newly added habits). */
export function firstUnusedColor(used: HabitColor[]): HabitColor {
  return HABIT_COLORS.find(c => !used.includes(c)) ?? defaultHabitColor(used.length)
}
