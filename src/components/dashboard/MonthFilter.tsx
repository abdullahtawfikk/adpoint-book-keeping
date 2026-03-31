'use client'

import { useMemo } from 'react'

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface MonthFilterProps {
  year: number
  month: number // 1-indexed
  onChange: (year: number, month: number) => void
}

export default function MonthFilter({ year, month, onChange }: MonthFilterProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-indexed

  // Last 12 months including current
  const options = useMemo(() => {
    const opts = []
    for (let i = 0; i < 12; i++) {
      let m = currentMonth - i
      let y = currentYear
      if (m <= 0) { m += 12; y -= 1 }
      opts.push({ year: y, month: m, label: `${MONTH_NAMES_FULL[m - 1]} ${y}` })
    }
    return opts
  }, [currentYear, currentMonth])

  function goBack() {
    let m = month - 1
    let y = year
    if (m <= 0) { m = 12; y -= 1 }
    onChange(y, m)
  }

  function goForward() {
    let m = month + 1
    let y = year
    if (m > 12) { m = 1; y += 1 }
    // Don't navigate past current month
    if (y > currentYear || (y === currentYear && m > currentMonth)) return
    onChange(y, m)
  }

  const isCurrentMonth = year === currentYear && month === currentMonth
  const selectValue = `${year}-${month}`

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={goBack}
        className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors text-sm"
        aria-label="Previous month"
      >
        ←
      </button>

      <div className="relative">
        <select
          value={selectValue}
          onChange={e => {
            const [y, m] = e.target.value.split('-').map(Number)
            onChange(y, m)
          }}
          className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-sm font-medium text-slate-700 cursor-pointer hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          {options.map(opt => (
            <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <button
        onClick={goForward}
        disabled={isCurrentMonth}
        className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        →
      </button>
    </div>
  )
}
