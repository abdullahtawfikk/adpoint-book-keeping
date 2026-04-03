'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import RevenueChart from '@/components/dashboard/RevenueChart'
import { formatEGP } from '@/lib/format'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CATEGORY_COLORS: Record<string, string> = {
  SOFTWARE: '#6366f1', MARKETING: '#f59e0b', SALARIES: '#10b981',
  RENT: '#3b82f6', EQUIPMENT: '#8b5cf6', TRAVEL: '#ec4899',
  UTILITIES: '#14b8a6', TAXES: '#f97316', OTHER: '#94a3b8',
}

interface ReportData {
  revenue: number
  expenses: number
  expensesByCategory: { category: string; total: number }[]
  revenueByMonth: { month: string; Revenue: number; Expenses: number }[]
  topClients: { name: string; company: string | null; total: number }[]
  dateFrom: string
  dateTo: string
}

type Preset = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom'

function getPresetDates(preset: Preset): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (preset === 'this_month') {
    return {
      from: new Date(y, m, 1).toISOString().split('T')[0],
      to: new Date(y, m + 1, 0).toISOString().split('T')[0],
    }
  }
  if (preset === 'last_month') {
    return {
      from: new Date(y, m - 1, 1).toISOString().split('T')[0],
      to: new Date(y, m, 0).toISOString().split('T')[0],
    }
  }
  if (preset === 'this_quarter') {
    const q = Math.floor(m / 3)
    return {
      from: new Date(y, q * 3, 1).toISOString().split('T')[0],
      to: new Date(y, q * 3 + 3, 0).toISOString().split('T')[0],
    }
  }
  if (preset === 'this_year') {
    return {
      from: new Date(y, 0, 1).toISOString().split('T')[0],
      to: new Date(y, 11, 31).toISOString().split('T')[0],
    }
  }
  return { from: '', to: '' }
}

export default function ReportsClient({ data }: { data: ReportData }) {
  const router = useRouter()
  const pathname = usePathname()
  const [preset, setPreset] = useState<Preset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [isPending, startTransition] = useTransition()
  const [downloading, setDownloading] = useState(false)

  const netProfit = data.revenue - data.expenses
  const margin = data.revenue > 0 ? (netProfit / data.revenue) * 100 : 0

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p === 'custom') return
    const { from, to } = getPresetDates(p)
    startTransition(() => {
      router.push(`${pathname}?from=${from}&to=${to}`)
    })
  }

  function applyCustom() {
    if (!customFrom || !customTo) return
    startTransition(() => {
      router.push(`${pathname}?from=${customFrom}&to=${customTo}`)
    })
  }

  async function downloadPDF() {
    setDownloading(true)
    const params = new URLSearchParams({ from: data.dateFrom, to: data.dateTo })
    const res = await fetch(`/api/reports/pdf?${params}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AdPoint-PL-Report-${data.dateFrom}-${data.dateTo}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }
    setDownloading(false)
  }

  const PRESETS: { label: string; value: Preset }[] = [
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'This Quarter', value: 'this_quarter' },
    { label: 'This Year', value: 'this_year' },
    { label: 'Custom', value: 'custom' },
  ]

  return (
    <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data.dateFrom} → {data.dateTo}
          </p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {downloading ? 'Generating...' : 'Export PDF'}
        </button>
      </div>

      {/* Date range selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => applyPreset(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                preset === p.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            <button onClick={applyCustom}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800">
              Apply
            </button>
          </div>
        )}
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-900">Profit & Loss Statement</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Revenue */}
          <div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-medium text-slate-900">Total Revenue</span>
              <span className="font-semibold text-emerald-600">{formatEGP(data.revenue)}</span>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Expenses by Category</p>
            {data.expensesByCategory.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">No expenses in this period.</p>
            ) : (
              <div className="space-y-1">
                {data.expensesByCategory.map(({ category, total }) => (
                  <div key={category} className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] ?? '#94a3b8' }} />
                      <span className="text-sm text-slate-600">{category.charAt(0) + category.slice(1).toLowerCase()}</span>
                    </div>
                    <span className="text-sm text-slate-700">{formatEGP(total)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-t border-slate-100 mt-1">
                  <span className="font-medium text-slate-900">Total Expenses</span>
                  <span className="font-semibold text-red-600">{formatEGP(data.expenses)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Net Profit */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-slate-900">Net Profit</span>
              <span className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatEGP(netProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Profit Margin</span>
              <span className={`text-sm font-semibold ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-medium text-slate-900 mb-5">Revenue by Month</h2>
          <RevenueChart data={data.revenueByMonth} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-900">Top Clients by Revenue</h2>
          </div>
          {data.topClients.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No paid invoices in this period.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.topClients.map((client, i) => (
                <div key={client.name} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-300 w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{client.name}</p>
                      {client.company && <p className="text-xs text-slate-400">{client.company}</p>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatEGP(client.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
