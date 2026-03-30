'use client'

import { useState, useMemo } from 'react'
import SlideOver from '@/components/ui/SlideOver'
import ExpenseForm from '@/components/expenses/ExpenseForm'
import { formatEGP, formatDate } from '@/lib/format'
import { deleteExpenseAction } from '@/lib/actions/expenses'
import { useTransition } from 'react'

const CATEGORIES = ['ALL', 'SOFTWARE', 'MARKETING', 'SALARIES', 'RENT', 'EQUIPMENT', 'TRAVEL', 'UTILITIES', 'TAXES', 'OTHER']

const BADGE_COLORS: Record<string, string> = {
  SOFTWARE:  'bg-indigo-100 text-indigo-700',
  MARKETING: 'bg-amber-100 text-amber-700',
  SALARIES:  'bg-emerald-100 text-emerald-700',
  RENT:      'bg-blue-100 text-blue-700',
  EQUIPMENT: 'bg-violet-100 text-violet-700',
  TRAVEL:    'bg-pink-100 text-pink-700',
  UTILITIES: 'bg-teal-100 text-teal-700',
  TAXES:     'bg-orange-100 text-orange-700',
  OTHER:     'bg-slate-100 text-slate-600',
}

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date: Date
  project: string | null
  isRecurring: boolean
  notes: string | null
}

export default function ExpensesClient({ expenses }: { expenses: Expense[] }) {
  const [open, setOpen] = useState(false)
  const [catFilter, setCatFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (catFilter !== 'ALL' && e.category !== catFilter) return false
      if (dateFrom && new Date(e.date) < new Date(dateFrom)) return false
      if (dateTo && new Date(e.date) > new Date(dateTo)) return false
      return true
    })
  }, [expenses, catFilter, dateFrom, dateTo])

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)

  function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return
    startTransition(() => deleteExpenseAction(id))
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''} · Total: <span className="font-medium text-slate-700">{formatEGP(total)}</span>
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 space-y-3">
        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                catFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {/* Date range */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          {(dateFrom || dateTo || catFilter !== 'ALL') && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setCatFilter('ALL') }}
              className="text-xs text-slate-400 hover:text-slate-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-slate-400 text-sm">No expenses found.</p>
            <button onClick={() => setOpen(true)} className="mt-3 text-sm font-medium text-slate-900 hover:underline">
              Add your first expense →
            </button>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Description</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Project</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{e.description}</p>
                        {e.isRecurring && (
                          <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5">
                            ↻ Recurring
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_COLORS[e.category] ?? 'bg-slate-100 text-slate-600'}`}>
                          {e.category.charAt(0) + e.category.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{e.project ?? '—'}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">{formatEGP(e.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(e.id)}
                          disabled={isPending}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map(e => (
                <div key={e.id} className="flex items-center justify-between px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-900 truncate">{e.description}</p>
                      {e.isRecurring && <span className="text-xs text-indigo-600">↻</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${BADGE_COLORS[e.category] ?? 'bg-slate-100 text-slate-600'}`}>
                        {e.category.charAt(0) + e.category.slice(1).toLowerCase()}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(e.date)}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-900 ml-3">{formatEGP(e.amount)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <SlideOver open={open} onClose={() => setOpen(false)} title="Add Expense">
        <ExpenseForm onSuccess={() => setOpen(false)} />
      </SlideOver>
    </>
  )
}
