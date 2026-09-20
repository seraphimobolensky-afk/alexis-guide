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
import { formatShortDate, pickTickDates } from '@/lib/habits'
import type { ValueType } from '@/app/guide/habits/data'

export interface ChartPoint {
  date: string
  value: number | null
}

interface Props {
  data: ChartPoint[]
  valueType: ValueType
  unit?: string | null
  target?: number | null
  chartType: 'bar' | 'line'
}

const axisTickStyle = { fontSize: 12, fontFamily: 'var(--font)', fill: 'var(--text-secondary)' }

export default function HabitChart({ data, valueType, unit, target, chartType }: Props) {
  const dates = data.map(d => d.date)
  const ticks = pickTickDates(dates, 6)

  const yDomain: [number, number] | undefined =
    valueType === 'boolean' ? [0, 1] : valueType === 'percent' ? [0, 100] : undefined

  function yTickFormatter(value: number) {
    if (valueType === 'boolean') return value === 1 ? 'Done' : ''
    if (valueType === 'percent') return `${value}%`
    return unit ? `${value}${unit}` : `${value}`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function tooltipFormatter(value: any) {
    if (valueType === 'boolean') return [value === 1 ? 'Done' : 'Not done', '']
    if (valueType === 'percent') return [`${value}%`, '']
    return [unit ? `${value} ${unit}` : `${value}`, '']
  }

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
        allowDecimals={valueType !== 'boolean'}
        tickFormatter={yTickFormatter}
        tick={axisTickStyle}
        axisLine={{ stroke: 'var(--border)' }}
        tickLine={false}
        width={44}
      />
      <Tooltip
        formatter={tooltipFormatter}
        labelFormatter={label => formatShortDate(String(label))}
        contentStyle={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'var(--font)',
          color: 'var(--text-primary)',
        }}
        cursor={{ fill: 'var(--border)' }}
      />
      {target != null && <ReferenceLine y={target} stroke="var(--text-muted)" strokeDasharray="4 4" />}
    </>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      {chartType === 'bar' ? (
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {sharedAxes}
          <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      ) : (
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {sharedAxes}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}
