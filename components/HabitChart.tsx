'use client'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import type { Formatter, NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { formatShortDate, pickTickDates } from '@/lib/habits'

/** One row per date; each series' value lives under its own `id` key. */
export type ChartRow = { date: string } & Record<string, number | null | string>

export interface ChartSeries {
  id: string
  label: string
  /** A CSS colour, e.g. `var(--habit-blue)` — resolved live, so it tracks the theme. */
  color: string
  /** SVG dash pattern; set when this colour is already used by another line. */
  dash?: string
}

/**
 * How the y-axis reads:
 * - `done`    — tick-off habit, single chart: 1 = done that day, 0 = not
 * - `count`   — tick-off habits combined: running total of times done in range
 * - `percent` — 0–100
 * - `number`  — free number, optionally with a unit
 */
export type ChartScale = 'done' | 'count' | 'percent' | 'number'

interface Props {
  data: ChartRow[]
  series: ChartSeries[]
  scale: ChartScale
  unit?: string | null
  target?: number | null
  chartType: 'bar' | 'line'
}

const axisTickStyle = { fontSize: 12, fontFamily: 'var(--font)', fill: 'var(--text-secondary)' }

export default function HabitChart({ data, series, scale, unit, target, chartType }: Props) {
  const dates = data.map(d => d.date)
  const ticks = pickTickDates(dates, 6)
  const combined = series.length > 1

  // Running totals: top out at the highest count actually on the chart (at
  // least 1), one tick per whole number. Left to itself recharts pads the
  // axis to ~5 ticks, so an all-zero chart would show a meaningless 0–4.
  // Steps stay even (at most ~4 of them), so a top value of 7 reads 0–2–4–6–8.
  const countMax = scale === 'count' ? Math.max(1, ...data.flatMap(row => series.map(s => Number(row[s.id]) || 0))) : 0
  const countStep = Math.ceil(countMax / 4) || 1
  const countTop = Math.ceil(countMax / countStep) * countStep
  const countTicks = scale === 'count' ? Array.from({ length: countTop / countStep + 1 }, (_, i) => i * countStep) : undefined

  const yDomain: [number, number] | undefined =
    scale === 'done' ? [0, 1] : scale === 'percent' ? [0, 100] : scale === 'count' ? [0, countTop] : undefined

  function formatValue(value: number) {
    if (scale === 'done') return value === 1 ? 'Done' : 'Not done'
    if (scale === 'count') return `${value}×`
    if (scale === 'percent') return `${value}%`
    return unit ? `${value} ${unit}` : `${value}`
  }

  function yTickFormatter(value: number) {
    if (scale === 'done') return value === 1 ? 'Done' : ''
    if (scale === 'number') return unit ? `${value}${unit}` : `${value}`
    return formatValue(value)
  }

  const tooltipFormatter: Formatter<ValueType, NameType> = (value, name) => [
    formatValue(Number(value)),
    combined ? String(name) : '',
  ]

  const sharedAxes = (
    <>
      <CartesianGrid stroke="var(--border)" vertical={false} />
      <XAxis
        dataKey="date"
        ticks={ticks}
        tickFormatter={formatShortDate}
        tick={axisTickStyle}
        axisLine={{ stroke: 'var(--border)' }}
        tickLine={false}
      />
      <YAxis
        domain={yDomain}
        allowDecimals={scale === 'percent' || scale === 'number'}
        ticks={countTicks}
        tickFormatter={yTickFormatter}
        tick={axisTickStyle}
        axisLine={{ stroke: 'var(--border)' }}
        tickLine={false}
        width={44}
      />
      <Tooltip
        formatter={tooltipFormatter}
        labelFormatter={label => formatShortDate(String(label))}
        // Values in the tooltip stay in text ink, not the series colour — the
        // colour lives on the marks and the legend chips.
        itemStyle={{ color: 'var(--text-primary)' }}
        contentStyle={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'var(--font)',
          color: 'var(--text-primary)',
        }}
        cursor={chartType === 'bar' ? { fill: 'var(--border)' } : { stroke: 'var(--border)' }}
      />
      {target != null && <ReferenceLine y={target} stroke="var(--text-muted)" strokeDasharray="4 4" />}
    </>
  )

  // Running totals are continuous, so dots would just be clutter; sparse
  // logged values need them, or a lone day with no neighbours is invisible.
  const showDots = scale !== 'count'

  return (
    <ResponsiveContainer width="100%" height={combined ? 260 : 220}>
      {chartType === 'bar' ? (
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {sharedAxes}
          {series.map(s => (
            <Bar
              key={s.id}
              dataKey={s.id}
              name={s.label}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      ) : (
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {sharedAxes}
          {series.map(s => (
            <Line
              key={s.id}
              // Running totals only ever step up once per logged day — a
              // smooth curve would imply progress between the days.
              type={scale === 'count' ? 'stepAfter' : 'monotone'}
              dataKey={s.id}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dash}
              // The 2px ring in the background colour keeps overlapping
              // dots from different lines readable.
              dot={showDots ? { r: 4, fill: s.color, stroke: 'var(--bg)', strokeWidth: combined ? 2 : 0 } : false}
              activeDot={{ r: 6, stroke: 'var(--bg)', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}
