'use client'
import { useMemo, useState, useTransition } from 'react'
import { logHabitEntry, removeHabitEntry, addHabit, updateHabit, archiveHabit, deleteHabit } from '@/app/actions'
import { rangeDates, todayDateString, type RangeDays } from '@/lib/habits'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import type { HabitRecord, EntryRecord } from '@/app/guide/habits/data'
import HabitChart, { type ChartPoint } from './HabitChart'
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
  const [pending, startTransition] = useTransition()

  const selected = habits.find(h => h.id === selectedId) ?? null
  const entries = useMemo(() => (selected ? entriesByHabit[selected.id] ?? [] : []), [selected, entriesByHabit])
  const entryByDate = useMemo(() => new Map(entries.map(e => [e.entryDate, e])), [entries])
  const today = todayDateString()
  const dates = useMemo(() => rangeDates(range, today), [range, today])

  const chartData: ChartPoint[] = useMemo(() => {
    if (!selected) return []
    return dates.map(date => {
      const entry = entryByDate.get(date)
      let value: number | null = null
      if (selected.valueType === 'boolean') value = entry ? 1 : 0
      else if (selected.valueType === 'number') value = entry?.valueNum ?? null
      else value = entry?.valuePct ?? null
      return { date, value }
    })
  }, [selected, dates, entryByDate])

  const hasAnyEntryInRange = selected ? dates.some(d => entryByDate.has(d)) : false
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
            {habits.map(h => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedId(h.id)}
                className={`${styles.habitPill} ${selectedId === h.id ? styles.habitPillActive + ' pressed-sm' : 'raised-sm'}`}
              >
                {h.icon && <span>{h.icon}</span>} {h.label}
              </button>
            ))}
          </div>

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
                  valueType={selected.valueType}
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
