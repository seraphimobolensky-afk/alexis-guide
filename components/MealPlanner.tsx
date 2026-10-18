'use client'
import { useMemo, useOptimistic, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Meal } from '@/app/guide/meal-planner/data'
import { copyMeal, deleteMeal, saveMeal } from '@/app/actions'
import type { GroceryChoice, MealInput } from '@/lib/mealGroceryRules'
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  PLANNER_VIEWS,
  formatDayLong,
  formatDayMonthShort,
  formatDayNumber,
  formatRangeTitle,
  formatWeekday,
  formatWeekdayShort,
  isSameMonth,
  monthGridDates,
  stepDate,
  weekDates,
  type MealSlot,
  type PlannerView,
} from '@/lib/mealPlan'
import MealCard, { type CopyResult, type SaveResult } from './MealCard'
import Reveal from './Reveal'
import styles from './MealPlanner.module.css'

interface Props {
  view: PlannerView
  date: string
  /** Today in London, worked out on the server so both sides agree. */
  today: string
  meals: Meal[]
  loadError?: boolean
}

type OpenSlot = (date: string, slot: MealSlot, trigger: HTMLElement) => void

type MealAction =
  | { type: 'save'; meal: Meal }
  | { type: 'remove'; date: string; slot: MealSlot }

function applyMealAction(meals: Meal[], action: MealAction): Meal[] {
  const date = action.type === 'save' ? action.meal.planDate : action.date
  const slot = action.type === 'save' ? action.meal.slot : action.slot
  const others = meals.filter(m => !(m.planDate === date && m.slot === slot))
  return action.type === 'save' ? [...others, action.meal] : others
}

/** What a save will look like once it lands, so the calendar can show it straight away. */
function optimisticMeal(input: MealInput): Meal {
  const temp = `temp-${Date.now()}-${Math.random()}`
  return {
    id: input.id ?? temp,
    planDate: input.date,
    slot: input.slot,
    name: input.name,
    notes: input.notes,
    recipeKey: input.recipeKey,
    ingredients: input.ingredients.map((i, index) => ({
      id: i.id ?? `${temp}-${index}`,
      name: i.name,
      quantity: i.quantity,
      addToGroceries: i.addToGroceries,
      groceryItemId: null,
      grocery: null,
      sortOrder: index,
    })),
  }
}

const VIEW_LABELS: Record<PlannerView, string> = { day: 'Day', week: 'Week', month: 'Month' }
const STEP_UNIT: Record<PlannerView, string> = { day: 'day', week: 'week', month: 'month' }
const WEEKDAY_HEADINGS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function mealKey(date: string, slot: MealSlot) {
  return `${date}|${slot}`
}

/** "Monday 19 October, dinner: Bolognese" / "…, dinner: nothing planned" */
function slotLabel(date: string, slot: MealSlot, meal: Meal | undefined) {
  return `${formatDayLong(date)}, ${slot}: ${meal ? meal.name : 'nothing planned'}`
}

export default function MealPlanner({ view, date, today, meals, loadError }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  // The toggle and title move straight away; the calendar itself stays on
  // the last loaded range (dimmed) until the new one arrives from the server.
  const [shown, setShown] = useOptimistic({ view, date })
  const [optimisticMeals, applyOptimistic] = useOptimistic(meals, applyMealAction)
  const [, startSave] = useTransition()
  const [open, setOpen] = useState<{ date: string; slot: MealSlot; trigger: HTMLElement } | null>(null)
  const [error, setError] = useState('')

  const mealsBySlot = useMemo(
    () => new Map(optimisticMeals.map(m => [mealKey(m.planDate, m.slot), m])),
    [optimisticMeals]
  )
  const mealFor = (d: string, slot: MealSlot) => mealsBySlot.get(mealKey(d, slot))

  function go(next: { view: PlannerView; date: string }) {
    startTransition(() => {
      setShown(next)
      router.replace(`${pathname}?view=${next.view}&date=${next.date}`, { scroll: false })
    })
  }

  const onOpenSlot: OpenSlot = (d, slot, trigger) => setOpen({ date: d, slot, trigger })

  /** Focus goes back to the slot that opened the card (or its day, if that slot's button is gone). */
  function handleCardClosed() {
    const closed = open
    setOpen(null)
    if (!closed) return
    requestAnimationFrame(() => {
      const target = closed.trigger.isConnected
        ? closed.trigger
        : document.querySelector<HTMLElement>(`[data-slot-key="${mealKey(closed.date, closed.slot)}"]`) ??
          document.querySelector<HTMLElement>(`[data-day-key="${closed.date}"]`)
      target?.focus()
    })
  }

  /**
   * Save with an optimistic update, like the grocery list: the dish shows in
   * its slot straight away, and if the save fails it rolls back and we say why.
   */
  function handleSave(input: MealInput): Promise<SaveResult> {
    setError('')
    return new Promise(resolve => {
      startSave(async () => {
        applyOptimistic({ type: 'save', meal: optimisticMeal(input) })
        try {
          const res = await saveMeal(input)
          if (res.error) setError(`Couldn’t save “${input.name}”, so it was taken off the plan again. (${res.error})`)
          resolve(res)
        } catch {
          setError(`Couldn’t save “${input.name}”. The save didn’t go through — try again.`)
          resolve({ error: 'The save didn’t go through' })
        }
      })
    })
  }

  function handleDelete(meal: { id: string; date: string; slot: MealSlot; name: string }, groceryChoice: GroceryChoice) {
    setError('')
    startSave(async () => {
      applyOptimistic({ type: 'remove', date: meal.date, slot: meal.slot })
      try {
        const res = await deleteMeal(meal.id, groceryChoice)
        if (res.error) setError(`Couldn’t delete “${meal.name}”, so it was put back. (${res.error})`)
      } catch {
        setError(`Couldn’t delete “${meal.name}”. The connection dropped — try again.`)
      }
    })
  }

  function handleCopy(input: { fromId: string; toDate: string; toSlot: MealSlot; replace: boolean }): Promise<CopyResult> {
    return new Promise(resolve => {
      startSave(async () => {
        try {
          resolve(await copyMeal(input))
        } catch {
          resolve({ error: 'The connection dropped' })
        }
      })
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div role="group" aria-label="Calendar view" className={styles.segmented}>
            {PLANNER_VIEWS.map(v => (
              <button
                key={v}
                type="button"
                aria-pressed={shown.view === v}
                onClick={() => shown.view !== v && go({ view: v, date: shown.date })}
                className={`${styles.segment} ${shown.view === v ? styles.segmentActive + ' pressed-sm' : 'raised-sm'}`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => go({ view: shown.view, date: today })}
            className={`${styles.todayButton} raised-sm`}
          >
            Today
          </button>
        </div>

        <div className={styles.navRow}>
          <button
            type="button"
            onClick={() => go({ view: shown.view, date: stepDate(shown.view, shown.date, -1) })}
            aria-label={`Previous ${STEP_UNIT[shown.view]}`}
            className={`${styles.arrow} raised-sm`}
          >
            ‹
          </button>
          <h3 className={styles.rangeTitle} aria-live="polite">
            {formatRangeTitle(shown.view, shown.date, today)}
            {shown.view === 'day' && shown.date === today && <span className={styles.todayTag}>Today</span>}
          </h3>
          <button
            type="button"
            onClick={() => go({ view: shown.view, date: stepDate(shown.view, shown.date, 1) })}
            aria-label={`Next ${STEP_UNIT[shown.view]}`}
            className={`${styles.arrow} raised-sm`}
          >
            ›
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className={styles.error}>
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className={styles.errorDismiss} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {open && (
        <MealCard
          key={mealKey(open.date, open.slot)}
          date={open.date}
          slot={open.slot}
          today={today}
          meal={mealFor(open.date, open.slot)}
          onSave={handleSave}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onClosed={handleCardClosed}
        />
      )}

      {loadError ? (
        <p className={styles.loadError}>
          Couldn’t load your meal plan right now. Try reloading the page in a moment.
        </p>
      ) : (
        <div className={`${styles.calendar} ${isPending ? styles.calendarPending : ''}`} aria-busy={isPending}>
          {view === 'day' && (
            <DayView date={date} mealFor={mealFor} onOpenSlot={onOpenSlot} />
          )}
          {view === 'week' && (
            <WeekView
              date={date}
              today={today}
              mealFor={mealFor}
              onOpenSlot={onOpenSlot}
            />
          )}
          {view === 'month' && (
            <MonthView
              date={date}
              today={today}
              mealFor={mealFor}
              onOpenSlot={onOpenSlot}
              onOpenDay={d => go({ view: 'day', date: d })}
            />
          )}
        </div>
      )}
    </div>
  )
}

interface ViewProps {
  date: string
  mealFor: (date: string, slot: MealSlot) => Meal | undefined
  onOpenSlot: OpenSlot
}

// ─── Day ─────────────────────────────────────────────────────────────────────

function DayView({ date, mealFor, onOpenSlot }: ViewProps) {
  return (
    <div className={styles.dayList}>
      {MEAL_SLOTS.map(slot => {
        const meal = mealFor(date, slot)
        return (
          <Reveal key={slot}>
            <div className={`${styles.mealCard} raised`}>
              <button
                type="button"
                onClick={e => onOpenSlot(date, slot, e.currentTarget)}
                data-slot-key={mealKey(date, slot)}
                aria-label={slotLabel(date, slot, meal)}
                className={styles.mealCardButton}
              >
                <span className={styles.slotEyebrow}>{MEAL_SLOT_LABELS[slot]}</span>
                {meal ? (
                  <span className={styles.mealName}>{meal.name}</span>
                ) : (
                  <span className={styles.addPrompt}>+ Add {slot}</span>
                )}
              </button>
              {meal?.notes && <p className={styles.mealNotes}>{meal.notes}</p>}
              {meal && meal.ingredients.length > 0 && (
                <ul className={styles.ingredients} aria-label={`Ingredients for ${meal.name}`}>
                  {meal.ingredients.map(i => (
                    <li key={i.id} className={styles.ingredient}>
                      <span className={styles.ingredientName}>{i.name}</span>
                      {i.quantity && <span className={styles.ingredientQty}>{i.quantity}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

// ─── Week ────────────────────────────────────────────────────────────────────

function WeekView({ date, today, mealFor, onOpenSlot }: ViewProps & { today: string }) {
  return (
    <div className={styles.week}>
      {weekDates(date).map(d => {
        const isToday = d === today
        return (
          <Reveal key={d} className={styles.weekItem}>
            <section
              className={`${styles.dayCard} raised`}
              aria-label={formatDayLong(d) + (isToday ? ', today' : '')}
            >
              <h4 className={`${styles.dayHeading} ${isToday ? styles.dayHeadingToday : ''}`}>
                <span className={styles.weekdayLong}>{formatWeekday(d)}</span>
                <span className={styles.weekdayShort}>{formatWeekdayShort(d)}</span>
                <span className={styles.dayDate}>{formatDayMonthShort(d)}</span>
                {isToday && <span className={styles.todayTag}>Today</span>}
              </h4>
              <ul className={styles.slotList}>
                {MEAL_SLOTS.map(slot => {
                  const meal = mealFor(d, slot)
                  return (
                    <li key={slot} className={styles.slotItem}>
                      <button
                        type="button"
                        onClick={e => onOpenSlot(d, slot, e.currentTarget)}
                        data-slot-key={mealKey(d, slot)}
                        aria-label={slotLabel(d, slot, meal)}
                        className={styles.slotRow}
                      >
                        <span className={styles.slotLabel}>{MEAL_SLOT_LABELS[slot]}</span>
                        {meal ? (
                          <span className={styles.slotDish}>{meal.name}</span>
                        ) : (
                          <span className={`${styles.slotDish} ${styles.slotEmpty}`}>+ Add</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          </Reveal>
        )
      })}
    </div>
  )
}

// ─── Month ───────────────────────────────────────────────────────────────────

function MonthView({
  date,
  today,
  mealFor,
  onOpenSlot,
  onOpenDay,
}: ViewProps & { today: string; onOpenDay: (date: string) => void }) {
  return (
    <div className={styles.monthWrap}>
      <div className={`${styles.month} raised`}>
        <div className={styles.monthHead} aria-hidden="true">
          {WEEKDAY_HEADINGS.map(w => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className={styles.monthGrid}>
          {monthGridDates(date).map(d => {
            const isToday = d === today
            const planned = MEAL_SLOTS.map(slot => ({ slot, meal: mealFor(d, slot) }))
            const summary = planned.filter(p => p.meal).map(p => `${p.slot} ${p.meal!.name}`)
            return (
              <div
                key={d}
                className={`${styles.cell} ${isSameMonth(d, date) ? '' : styles.cellOutside}`}
              >
                <button
                  type="button"
                  onClick={() => onOpenDay(d)}
                  data-day-key={d}
                  aria-label={`${formatDayLong(d)}${isToday ? ', today' : ''}: ${
                    summary.length ? summary.join(', ') : 'nothing planned'
                  }`}
                  aria-current={isToday ? 'date' : undefined}
                  className={styles.cellButton}
                >
                  <span className={`${styles.cellDate} ${isToday ? styles.cellDateToday : ''}`}>
                    {formatDayNumber(d)}
                  </span>
                  <span className={styles.dots} aria-hidden="true">
                    {planned.map(({ slot, meal }) => (
                      <span key={slot} className={`${styles.dot} ${meal ? styles.dotFilled : ''}`} />
                    ))}
                  </span>
                </button>
                <div className={styles.cellMeals}>
                  {planned.map(({ slot, meal }) =>
                    meal ? (
                      <button
                        key={slot}
                        type="button"
                        onClick={e => onOpenSlot(d, slot, e.currentTarget)}
                        data-slot-key={mealKey(d, slot)}
                        aria-label={slotLabel(d, slot, meal)}
                        className={styles.cellMeal}
                      >
                        {meal.name}
                      </button>
                    ) : null
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className={styles.legend}>
        <span>Dots: breakfast, lunch, dinner ·</span>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotFilled}`} aria-hidden="true" /> planned
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} aria-hidden="true" /> empty
        </span>
      </p>
    </div>
  )
}
