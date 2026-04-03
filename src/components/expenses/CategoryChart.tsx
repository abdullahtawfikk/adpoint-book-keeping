'use client'

import { formatEGP } from '@/lib/format'

const CATEGORY_COLORS: Record<string, string> = {
  SOFTWARE:  '#6366f1',
  MARKETING: '#f59e0b',
  SALARIES:  '#10b981',
  RENT:      '#3b82f6',
  EQUIPMENT: '#8b5cf6',
  TRAVEL:    '#ec4899',
  UTILITIES: '#14b8a6',
  TAXES:     '#f97316',
  OTHER:     '#94a3b8',
}

interface CategoryTotal {
  category: string
  total: number
}

export default function CategoryChart({ data, grandTotal }: { data: CategoryTotal[]; grandTotal: number }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No expenses yet.</p>
  }

  const sorted = [...data].sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-3">
      {sorted.map(({ category, total }) => {
        const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0
        const color = CATEGORY_COLORS[category] ?? '#94a3b8'
        const label = category.charAt(0) + category.slice(1).toLowerCase()
        return (
          <div key={category}>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-slate-600">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{pct.toFixed(0)}%</span>
                <span className="font-medium text-slate-900">{formatEGP(total)}</span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
