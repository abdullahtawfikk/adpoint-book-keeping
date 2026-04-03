'use client'

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ChartData {
  month: string
  Revenue: number
  Expenses: number
}

function formatK(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
  return String(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-slate-700 mb-2">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-medium text-slate-900">
            {entry.value.toLocaleString('en-EG')} EGP
          </span>
        </div>
      ))}
    </div>
  )
}

interface RevenueChartProps {
  data: ChartData[]
  selectedMonthIndex?: number
}

export default function RevenueChart({ data, selectedMonthIndex }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatK}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 12 }}
        />
        <Bar dataKey="Revenue" fill="#0f172a" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell
              key={`rev-${index}`}
              fill={selectedMonthIndex !== undefined && index === selectedMonthIndex ? '#2563eb' : '#0f172a'}
            />
          ))}
        </Bar>
        <Bar dataKey="Expenses" fill="#e2e8f0" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell
              key={`exp-${index}`}
              fill={selectedMonthIndex !== undefined && index === selectedMonthIndex ? '#93c5fd' : '#e2e8f0'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
