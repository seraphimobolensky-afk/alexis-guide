'use client'
import { useState } from 'react'
import type { ValueType } from '@/app/guide/habits/data'
import styles from './HabitForm.module.css'

export interface HabitFormValues {
  label: string
  icon: string
  valueType: ValueType
  unit: string
  target: string
}

interface Props {
  initial?: Partial<HabitFormValues>
  submitLabel: string
  busy?: boolean
  error?: string
  onSubmit: (values: HabitFormValues) => void
  onCancel: () => void
}

const VALUE_TYPE_OPTIONS: { value: ValueType; label: string }[] = [
  { value: 'boolean', label: 'Tick-off' },
  { value: 'number', label: 'Number' },
  { value: 'percent', label: 'Percentage' },
]

export default function HabitForm({ initial, submitLabel, busy, error, onSubmit, onCancel }: Props) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [valueType, setValueType] = useState<ValueType>(initial?.valueType ?? 'boolean')
  const [unit, setUnit] = useState(initial?.unit ?? '')
  const [target, setTarget] = useState(initial?.target ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    onSubmit({ label: label.trim(), icon: icon.trim(), valueType, unit: unit.trim(), target })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Icon</span>
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="🏃"
            maxLength={4}
            className={`${styles.input} ${styles.iconInput} pressed`}
          />
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Name</span>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Read for 20 minutes"
            required
            className={`${styles.input} pressed`}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Type</span>
        <div className={styles.segmented}>
          {VALUE_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValueType(opt.value)}
              className={`${styles.segment} ${valueType === opt.value ? styles.segmentActive + ' pressed-sm' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </label>

      {valueType !== 'boolean' && (
        <div className={styles.row}>
          {valueType === 'number' && (
            <label className={styles.field}>
              <span className={styles.label}>Unit (optional)</span>
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="km, pages, glasses"
                className={`${styles.input} pressed`}
              />
            </label>
          )}
          <label className={`${styles.field} ${styles.grow}`}>
            <span className={styles.label}>Target (optional)</span>
            <input
              value={target}
              onChange={e => setTarget(e.target.value)}
              inputMode="decimal"
              placeholder={valueType === 'percent' ? '100' : 'e.g. 5'}
              className={`${styles.input} pressed`}
            />
          </label>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancel}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={`${styles.submit} raised-sm`}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
