'use client'
import { useMemo, useState, useTransition } from 'react'
import { logHabitEntry, removeHabitEntry, addHabit, updateHabit, archiveHabit, deleteHabit } from '@/app/actions'
import { rangeDates, todayDateString, type RangeDays } from '@/lib/habits'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import type { HabitRecord, EntryRecord } from '@/app/guide/habits/data'
import { HABIT_COLORS, dashForRepeat, firstUnusedColor, habitColorVar, type HabitColor } from '@/lib/habitColors'
import HabitChart, { type ChartRow, type ChartScale, type ChartSeries } from './HabitChart'
import HabitForm, { type HabitFormValues } from './HabitForm'
import styles from './HabitChartPanel.module.css'

interface Props {
  title: string
  storageKeyPrefix: string
  habits: HabitRecord[]
  entriesByHabit: Record<string, EntryRecord[]>
  manageable: boolean
  group: 'cleaning' | 'custom'
}

const RANGE_OPTIONS: RangeDays[] = [7, 30, 90]

/** Picker value for the combined "all habits on one chart" view. */
const ALL = '__all__'

/**
 * Habits can only share a chart if they share a y-axis, so the combined view
 * groups them by what they measure: tick-offs, percentages, or numbers in a
 * given unit (a "km" habit and a "minutes" habit never share an axis).
 */
function measureOf(habit: HabitRecord): string {
  if (habit.valueType === 'number') return `number:${habit.unit ?? ''}`
  return habit.valueType
}

function measureLabel(measure: string): string {
  if (measure === 'boolean') return 'Tick-offs'
  if (measure === 'percent') return 'Percentages'
  return measure.slice('number:'.length) || 'Numbers'
}

function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base || 'habit'}-${Math.random().toString(36).slice(2, 7)}`
}

export default function HabitChartPanel({ title, storageKeyPrefix, habits, entriesByHabit, manageable, group }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(habits[0]?.id ?? null)
  const [chartType, setChartType] = useLocalStorageState<'bar' | 'line'>(`${storageKeyPrefix}:chartType`, 'bar')
  const [range, setRange] = useState<RangeDays>(30)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formBusy, setFormBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [numInput, setNumInput] = useState('')
  const [measure, setMeasure] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set())
  const [colorError, setColorError] = useState('')
  const [pending, startTransition] = useTransition()

  const combinedMode = selectedId === ALL && habits.length > 1
  const selected = combinedMode ? null : habits.find(h => h.id === selectedId) ?? null
  const entries = useMemo(() => (selected ? entriesByHabit[selected.id] ?? [] : []), [selected, entriesByHabit])
  const entryByDate = useMemo(() => new Map(entries.map(e => [e.entryDate, e])), [entries])
  const today = todayDateString()
  const dates = useMemo(() => rangeDates(range, today), [range, today])

  const chartData: ChartRow[] = useMemo(() => {
    if (!selected) return []
    return dates.map(date => {
      const entry = entryByDate.get(date)
      let value: number | null = null
      if (selected.valueType === 'boolean') value = entry ? 1 : 0
      else if (selected.valueType === 'number') value = entry?.valueNum ?? null
      else value = entry?.valuePct ?? null
      return { date, [selected.id]: value }
    })
  }, [selected, dates, entryByDate])

  const hasAnyEntryInRange = selected ? dates.some(d => entryByDate.has(d)) : false

  // ─── Combined view ───
  const measures = useMemo(() => [...new Set(habits.map(measureOf))], [habits])
  const activeMeasure = measure && measures.includes(measure) ? measure : measures[0]
  const measureHabits = useMemo(() => habits.filter(h => measureOf(h) === activeMeasure), [habits, activeMeasure])
  const drawnHabits = useMemo(() => measureHabits.filter(h => !hiddenIds.has(h.id)), [measureHabits, hiddenIds])
  // With more habits than palette colours, colours repeat — a repeat is told
  // apart by its dash pattern. Counted over the whole measure group (not just
  // what's switched on) so turning a line off never restyles the others.
  const dashById = useMemo(() => {
    const seen: Record<string, number> = {}
    return new Map(
      measureHabits.map(h => {
        const repeat = (seen[h.color] = (seen[h.color] ?? -1) + 1)
        return [h.id, dashForRepeat(repeat)]
      })
    )
  }, [measureHabits])

  const combinedScale: ChartScale =
    activeMeasure === 'boolean' ? 'count' : activeMeasure === 'percent' ? 'percent' : 'number'

  const combinedData: ChartRow[] = useMemo(() => {
    if (!combinedMode) return []
    const lookups = drawnHabits.map(h => ({
      habit: h,
      byDate: new Map((entriesByHabit[h.id] ?? []).map(e => [e.entryDate, e])),
      runningTotal: 0,
    }))
    return dates.map(date => {
      const row: ChartRow = { date }
      for (const l of lookups) {
        const entry = l.byDate.get(date)
        if (l.habit.valueType === 'boolean') {
          if (entry) l.runningTotal += 1
          row[l.habit.id] = l.runningTotal
        } else {
          row[l.habit.id] = (l.habit.valueType === 'number' ? entry?.valueNum : entry?.valuePct) ?? null
        }
      }
      return row
    })
  }, [combinedMode, drawnHabits, entriesByHabit, dates])

  const combinedSeries: ChartSeries[] = drawnHabits.map(h => ({
    id: h.id,
    label: h.label,
    color: habitColorVar(h.color),
    dash: dashById.get(h.id),
  }))

  const combinedHasData = drawnHabits.some(h =>
    (entriesByHabit[h.id] ?? []).some(e => e.entryDate >= dates[0] && e.entryDate <= today)
  )

  function toggleLegendHabit(habitId: string) {
    setHiddenIds(prev => {
      const next = new Set(prev)
      if (next.has(habitId)) next.delete(habitId)
      else next.add(habitId)
      return next
    })
  }

  function handleColorChange(habitId: string, color: HabitColor) {
    setColorError('')
    startTransition(async () => {
      const res = await updateHabit(habitId, { color })
      if (res.error) setColorError(`Couldn’t save the colour: ${res.error}`)
    })
  }
  const todayEntry = selected ? entryByDate.get(today) : undefined

  function handleAddOrEditSubmit(values: HabitFormValues, habitId?: string) {
    setFormError('')
    setFormBusy(true)
    const target = values.target.trim() ? Number(values.target) : undefined

    startTransition(async () => {
      if (habitId) {
        const res = await updateHabit(habitId, {
          label: values.label,
          icon: values.icon,
          unit: values.unit,
          target: target ?? null,
        })
        setFormBusy(false)
        if (res.error) setFormError(res.error)
        else setEditingId(null)
      } else {
        const res = await addHabit({
          key: slugify(values.label),
          label: values.label,
          icon: values.icon || undefined,
          valueType: values.valueType,
          unit: values.unit || undefined,
          target,
          group,
          color: firstUnusedColor(habits.map(h => h.color)),
        })
        setFormBusy(false)
        if (res.error) {
          setFormError(res.error)
        } else {
          setShowAddForm(false)
          if (res.data) setSelectedId(res.data.id)
        }
      }
    })
  }

  function handleArchive(habitId: string) {
    startTransition(async () => {
      await archiveHabit(habitId)
      if (selectedId === habitId) setSelectedId(habits.find(h => h.id !== habitId)?.id ?? null)
    })
  }

  function handleDelete(habitId: string) {
    startTransition(async () => {
      await deleteHabit(habitId)
      setConfirmDeleteId(null)
      if (selectedId === habitId) setSelectedId(habits.find(h => h.id !== habitId)?.id ?? null)
    })
  }

  function toggleBooleanToday() {
    if (!selected) return
    startTransition(async () => {
      if (todayEntry) await removeHabitEntry({ habitId: selected.id })
      else await logHabitEntry({ habitId: selected.id })
    })
  }

  function submitNumericToday() {
    if (!selected || !numInput.trim()) return
    const num = Number(numInput)
    if (Number.isNaN(num)) return
    startTransition(async () => {
      if (selected.valueType === 'number') await logHabitEntry({ habitId: selected.id, valueNum: num })
      else await logHabitEntry({ habitId: selected.id, valuePct: num })
      setNumInput('')
    })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {manageable && (
          <button type="button" onClick={() => setShowAddForm(s => !s)} className={styles.addButton}>
            {showAddForm ? 'Close' : '+ Add habit'}
          </button>
        )}
      </div>

      {showAddForm && (
        <HabitForm
          submitLabel="Add habit"
          busy={formBusy}
          error={formError}
          onSubmit={values => handleAddOrEditSubmit(values)}
          onCancel={() => {
            setShowAddForm(false)
            setFormError('')
          }}
        />
      )}

      {habits.length === 0 ? (
        <p className={styles.empty}>
          {manageable
            ? 'You haven’t added any habits yet — use “+ Add habit” above to start tracking something.'
            : 'No cleaning habits found yet.'}
        </p>
      ) : (
        <>
          <div className={styles.habitPicker}>
            {habits.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedId(ALL)}
                className={`${styles.habitPill} ${combinedMode ? styles.habitPillActive + ' pressed-sm' : 'raised-sm'}`}
              >
                All on one chart
              </button>
            )}
            {habits.map(h => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedId(h.id)}
                className={`${styles.habitPill} ${selectedId === h.id ? styles.habitPillActive + ' pressed-sm' : 'raised-sm'}`}
              >
                <span className={styles.colorDot} style={{ background: habitColorVar(h.color) }} aria-hidden />
                {h.icon && <span>{h.icon}</span>} {h.label}
              </button>
            ))}
          </div>

          {combinedMode && (
            <>
              <div className={styles.controls}>
                {measures.length > 1 ? (
                  <div className={styles.segmented}>
                    {measures.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMeasure(m)}
                        aria-pressed={activeMeasure === m}
                        className={`${styles.segment} ${activeMeasure === m ? styles.segmentActive + ' pressed-sm' : ''}`}
                      >
                        {measureLabel(m)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span />
                )}
                <div className={styles.segmented}>
                  {RANGE_OPTIONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRange(r)}
                      aria-pressed={range === r}
                      className={`${styles.segment} ${range === r ? styles.segmentActive + ' pressed-sm' : ''}`}
                    >
                      {r}d
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.legend} role="group" aria-label="Lines shown on the chart">
                {measureHabits.map(h => {
                  const on = !hiddenIds.has(h.id)
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleLegendHabit(h.id)}
                      aria-pressed={on}
                      className={`${styles.legendChip} ${on ? '' : styles.legendChipOff}`}
                    >
                      {/* A sample of the actual line (colour + dash), so repeated
                          colours stay identifiable from the key. */}
                      <svg width="20" height="10" aria-hidden className={styles.lineSample}>
                        <line
                          x1="1"
                          y1="5"
                          x2="19"
                          y2="5"
                          stroke={habitColorVar(h.color)}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={dashById.get(h.id)}
                        />
                      </svg>
                      {h.label}
                    </button>
                  )
                })}
              </div>

              {drawnHabits.length === 0 ? (
                <p className={styles.empty}>All lines are turned off — tap a habit above to show it.</p>
              ) : combinedHasData ? (
                <>
                  <HabitChart
                    data={combinedData}
                    series={combinedSeries}
                    scale={combinedScale}
                    unit={activeMeasure.startsWith('number:') ? activeMeasure.slice('number:'.length) || null : null}
                    chartType="line"
                  />
                  {combinedScale === 'count' && (
                    <p className={styles.hint}>Each line counts how many times you’ve done it over the last {range} days.</p>
                  )}
                </>
              ) : (
                <p className={styles.empty}>Nothing logged for these habits in the last {range} days yet.</p>
              )}

              <p className={styles.hint}>To log today or change a colour, pick a single habit above.</p>
            </>
          )}

          {selected && (
            <>
              <div className={styles.controls}>
                <div className={styles.segmented}>
                  {(['bar', 'line'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setChartType(t)}
                      aria-pressed={chartType === t}
                      className={`${styles.segment} ${chartType === t ? styles.segmentActive + ' pressed-sm' : ''}`}
                    >
                      {t === 'bar' ? 'Bar' : 'Line'}
                    </button>
                  ))}
                </div>
                <div className={styles.segmented}>
                  {RANGE_OPTIONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRange(r)}
                      aria-pressed={range === r}
                      className={`${styles.segment} ${range === r ? styles.segmentActive + ' pressed-sm' : ''}`}
                    >
                      {r}d
                    </button>
                  ))}
                </div>
              </div>

              {hasAnyEntryInRange ? (
                <HabitChart
                  data={chartData}
                  series={[{ id: selected.id, label: selected.label, color: habitColorVar(selected.color) }]}
                  scale={selected.valueType === 'boolean' ? 'done' : selected.valueType}
                  unit={selected.unit}
                  target={selected.target}
                  chartType={chartType}
                />
              ) : (
                <p className={styles.empty}>
                  No data yet for “{selected.label}” in the last {range} days. Log today below to get started.
                </p>
              )}

              <div className={styles.logRow}>
                <span className={styles.logLabel}>Log today</span>
                {selected.valueType === 'boolean' ? (
                  <button
                    type="button"
                    onClick={toggleBooleanToday}
                    disabled={pending}
                    className={`${styles.logButton} ${todayEntry ? styles.logButtonDone + ' pressed-sm' : 'raised-sm'}`}
                  >
                    {todayEntry ? '✓ Done today' : 'Mark done'}
                  </button>
                ) : (
                  <div className={styles.numericLog}>
                    <input
                      value={numInput}
                      onChange={e => setNumInput(e.target.value)}
                      inputMode="decimal"
                      placeholder={
                        todayEntry
                          ? String(selected.valueType === 'number' ? todayEntry.valueNum : todayEntry.valuePct)
                          : selected.valueType === 'percent'
                            ? '0–100'
                            : selected.unit
                              ? `in ${selected.unit}`
                              : 'value'
                      }
                      className={`${styles.numInput} pressed`}
                    />
                    <button
                      type="button"
                      onClick={submitNumericToday}
                      disabled={pending || !numInput.trim()}
                      className={`${styles.logButton} raised-sm`}
                    >
                      Log
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.colorRow}>
                <span className={styles.logLabel}>Colour</span>
                <div className={styles.swatches} role="radiogroup" aria-label={`Colour for ${selected.label}`}>
                  {HABIT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={selected.color === c}
                      aria-label={c}
                      title={c}
                      disabled={pending}
                      onClick={() => selected.color !== c && handleColorChange(selected.id, c)}
                      className={`${styles.swatch} ${selected.color === c ? styles.swatchActive : ''}`}
                      style={{ background: habitColorVar(c) }}
                    />
                  ))}
                </div>
              </div>
              {colorError && <p className={styles.hint}>{colorError}</p>}

              {manageable && (
                <div className={styles.manageRow}>
                  {editingId === selected.id ? (
                    <HabitForm
                      initial={{
                        label: selected.label,
                        icon: selected.icon ?? '',
                        valueType: selected.valueType,
                        unit: selected.unit ?? '',
                        target: selected.target != null ? String(selected.target) : '',
                      }}
                      submitLabel="Save changes"
                      busy={formBusy}
                      error={formError}
                      onSubmit={values => handleAddOrEditSubmit(values, selected.id)}
                      onCancel={() => {
                        setEditingId(null)
                        setFormError('')
                      }}
                    />
                  ) : confirmDeleteId === selected.id ? (
                    <div className={styles.confirmDelete}>
                      <p>Delete “{selected.label}” and all of its logged history? This can’t be undone.</p>
                      <div className={styles.confirmActions}>
                        <button type="button" onClick={() => setConfirmDeleteId(null)} className={styles.cancelLink}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(selected.id)}
                          className={styles.deleteConfirmButton}
                        >
                          Yes, delete it
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={() => setEditingId(selected.id)} className={styles.manageLink}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleArchive(selected.id)} className={styles.manageLink}>
                        Archive
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(selected.id)}
                        className={styles.manageLinkDanger}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
