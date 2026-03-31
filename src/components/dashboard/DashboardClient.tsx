'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatEGP, formatDate } from '@/lib/format'
import StatusBadge from '@/components/ui/StatusBadge'
import RevenueChart from '@/components/dashboard/RevenueChart'
import MonthFilter from '@/components/dashboard/MonthFilter'

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface ChartDataPoint {
  month: string
  Revenue: number
  Expenses: number
}

interface ActivityItem {
  type: 'invoice' | 'expense'
  id: string
  description: string
  amount: number
  date: string
  status?: string
  category?: string
}

interface UpcomingInvoice {
  id: string
  number: string
  total: number
  status: string
  dueDate: string
  client: { name: string }
}

export interface DashboardData {
  monthRevenue: number
  monthExpenses: number
  allTimeRevenue: number
  allTimeExpenses: number
  unpaidTotal: number
  unpaidCount: number
  overdueTotal: number
  overdueCount: number
  chartData: ChartDataPoint[]
  activity: ActivityItem[]
  upcomingInvoices: UpcomingInvoice[]
}

interface DashboardClientProps {
  greeting: string
  displayName: string
  initialData: DashboardData
  initialYear: number
  initialMonth: number // 1-indexed
}

export default function DashboardClient({
  greeting,
  displayName,
  initialData,
  initialYear,
  initialMonth,
}: DashboardClientProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [data, setData] = useState<DashboardData>(initialData)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard?year=${y}&month=${m}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  function handleMonthChange(y: number, m: number) {
    setYear(y)
    setMonth(m)
    fetchData(y, m)
  }

  const netProfit = data.monthRevenue - data.monthExpenses
  const allTimeBalance = data.allTimeRevenue - data.allTimeExpenses
  const monthLabel = `${MONTH_NAMES_FULL[month - 1]} ${year}`

  // The selected month is always the last bar in the 6-month chart window
  const selectedMonthIndex = 5

  return (
    <div className={`p-5 md:p-8 transition-opacity duration-150 ${loading ? 'opacity-60' : 'opacity-100'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{greeting}, {displayName}</h1>
          <p className="text-sm text-slate-500 mt-1">Here&apos;s your financial overview</p>
        </div>
        <div className="flex-shrink-0 mt-1">
          <MonthFilter year={year} month={month} onChange={handleMonthChange} />
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-7">
        <MetricCard
          label={`Revenue — ${monthLabel}`}
          value={formatEGP(data.monthRevenue)}
          color="emerald"
          icon="↑"
        />
        <MetricCard
          label={`Expenses — ${monthLabel}`}
          value={formatEGP(data.monthExpenses)}
          color="red"
          icon="↓"
        />
        <MetricCard
          label="Net Profit"
          value={formatEGP(netProfit)}
          sub={monthLabel}
          color={netProfit >= 0 ? 'emerald' : 'red'}
          icon={netProfit >= 0 ? '↑' : '↓'}
          highlight
        />
        <MetricCard
          label="Outstanding Invoices"
          value={formatEGP(data.unpaidTotal)}
          sub={`${data.unpaidCount} unpaid`}
          color="amber"
          icon="!"
        />
        <MetricCard
          label="Overdue Invoices"
          value={formatEGP(data.overdueTotal)}
          sub={`${data.overdueCount} overdue`}
          color="red"
          icon="!"
        />
        <MetricCard
          label="All-time Balance"
          value={formatEGP(allTimeBalance)}
          sub="all time"
          color={allTimeBalance >= 0 ? 'slate' : 'red'}
          icon="="
        />
      </div>

      {/* Chart + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-medium text-slate-900 mb-5">Revenue vs Expenses</h2>
          <RevenueChart data={data.chartData} selectedMonthIndex={selectedMonthIndex} />
        </div>

        {/* Upcoming payments */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-900">Due in 7 Days</h2>
          </div>
          {data.upcomingInvoices.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-slate-400 text-sm">No upcoming payments.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.upcomingInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.client.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{inv.number} · Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatEGP(inv.total)}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-900">Recent Activity</h2>
        </div>
        {data.activity.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-400 text-sm">No activity yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.activity.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  item.type === 'invoice'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-red-100 text-red-500'
                }`}>
                  {item.type === 'invoice' ? 'INV' : 'EXP'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{item.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-medium ${item.type === 'expense' ? 'text-red-500' : 'text-slate-900'}`}>
                    {item.type === 'expense' ? '− ' : ''}{formatEGP(item.amount)}
                  </p>
                  {item.type === 'invoice' && item.status && (
                    <div className="mt-0.5 flex justify-end">
                      <StatusBadge status={item.status} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  color,
  icon,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  color: 'emerald' | 'red' | 'amber' | 'slate'
  icon: string
  highlight?: boolean
}) {
  const iconBg: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-500',
    amber: 'bg-amber-100 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
  }
  const valueColor: Record<string, string> = {
    emerald: highlight ? 'text-emerald-600' : 'text-slate-900',
    red: highlight ? 'text-red-600' : 'text-slate-900',
    amber: 'text-slate-900',
    slate: 'text-slate-900',
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs text-slate-500 leading-snug">{label}</p>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${iconBg[color]}`}>
          {icon}
        </div>
      </div>
      <p className={`text-lg md:text-xl font-semibold leading-none ${valueColor[color]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  )
}
