'use client'

import { useState, useTransition } from 'react'
import { createExpenseAction } from '@/lib/actions/expenses'

const CATEGORIES = [
  'SOFTWARE', 'MARKETING', 'SALARIES', 'RENT',
  'EQUIPMENT', 'TRAVEL', 'UTILITIES', 'TAXES', 'OTHER',
]

export default function ExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'SOFTWARE',
    date: new Date().toISOString().split('T')[0],
    project: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim()) { setError('Description is required'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a valid amount'); return }
    setError('')
    startTransition(async () => {
      try {
        await createExpenseAction({
          description: form.description,
          amount: parseFloat(form.amount),
          category: form.category,
          date: form.date,
          project: form.project || undefined,
          isRecurring,
          notes: form.notes || undefined,
        })
        onSuccess()
      } catch {
        setError('Something went wrong.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
        <input
          type="text"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="e.g. Adobe Creative Cloud"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (EGP) *</label>
          <input
            type="number"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
        <select
          value={form.category}
          onChange={e => set('category', e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Link to Project (optional)</label>
        <input
          type="text"
          value={form.project}
          onChange={e => set('project', e.target.value)}
          placeholder="e.g. Nostar Shopify Build"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          placeholder="Optional notes..."
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-slate-700">Recurring Expense</p>
          <p className="text-xs text-slate-400">Monthly recurring cost</p>
        </div>
        <button
          type="button"
          onClick={() => setIsRecurring(v => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRecurring ? 'bg-slate-900' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Adding...' : 'Add Expense'}
      </button>
    </form>
  )
}
