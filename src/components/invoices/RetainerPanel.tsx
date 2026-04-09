'use client'

import { useState, useTransition } from 'react'
import { formatEGP, formatDate } from '@/lib/format'
import {
  toggleRetainerAction,
  addRetainerEntryAction,
  deleteRetainerEntryAction,
} from '@/lib/actions/portal-features'

export interface RetainerEntry {
  id: string
  description: string
  hours: number | null
  amount: number
  date: string
}

interface RetainerPanelProps {
  invoiceId: string
  initialIsRetainer: boolean
  initialRetainerHours: number | null
  initialEntries: RetainerEntry[]
}

export default function RetainerPanel({
  invoiceId,
  initialIsRetainer,
  initialRetainerHours,
  initialEntries,
}: RetainerPanelProps) {
  const [isRetainer,    setIsRetainer]    = useState(initialIsRetainer)
  const [retainerHours, setRetainerHours] = useState(initialRetainerHours)
  const [entries,       setEntries]       = useState(initialEntries)
  const [showForm,      setShowForm]      = useState(false)
  const [isPending,     startTransition]  = useTransition()

  // Form state
  const [description, setDescription] = useState('')
  const [hours,       setHours]       = useState('')
  const [amount,      setAmount]      = useState('')
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10))

  const usedHours = entries.reduce((s, e) => s + (e.hours ?? 0), 0)
  const totalLogged = entries.reduce((s, e) => s + e.amount, 0)

  function handleToggle() {
    startTransition(async () => {
      await toggleRetainerAction(invoiceId, !isRetainer, retainerHours ?? undefined)
      setIsRetainer(v => !v)
    })
  }

  function handleAddEntry() {
    if (!description.trim() || !amount) return
    startTransition(async () => {
      const entry = await addRetainerEntryAction({
        invoiceId,
        description: description.trim(),
        hours: hours ? Number(hours) : undefined,
        amount: Number(amount),
        date,
      })
      setEntries(prev => [...prev, {
        id: entry.id,
        description: entry.description,
        hours: entry.hours,
        amount: entry.amount,
        date: entry.date.toISOString(),
      }])
      setShowForm(false)
      setDescription(''); setHours(''); setAmount(''); setDate(new Date().toISOString().slice(0, 10))
    })
  }

  function handleDelete(entryId: string) {
    startTransition(async () => {
      await deleteRetainerEntryAction(entryId)
      setEntries(prev => prev.filter(e => e.id !== entryId))
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h2 className="font-medium text-slate-900">Retainer</h2>
          {isRetainer && retainerHours && (
            <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
              {usedHours.toFixed(1)} / {retainerHours}h used
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRetainer && (
            <button
              type="button"
              onClick={() => setShowForm(v => !v)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Log Work
            </button>
          )}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${isRetainer ? 'bg-slate-900' : 'bg-slate-200'}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isRetainer ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {isRetainer && (
        <>
          {/* Hours cap setting */}
          <div className="border-b border-slate-100 px-6 py-3 flex items-center gap-3">
            <label className="text-xs font-medium text-slate-500">Monthly hours cap</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={retainerHours ?? ''}
              onChange={e => setRetainerHours(e.target.value ? Number(e.target.value) : null)}
              onBlur={() => startTransition(() => toggleRetainerAction(invoiceId, true, retainerHours ?? undefined))}
              placeholder="e.g. 40"
              className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
            />
            <span className="text-xs text-slate-400">hours</span>
          </div>

          {/* Progress bar */}
          {retainerHours && (
            <div className="px-6 py-3 border-b border-slate-100">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usedHours > retainerHours ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min((usedHours / retainerHours) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-slate-400">
                <span>{usedHours.toFixed(1)}h used</span>
                <span>{Math.max(retainerHours - usedHours, 0).toFixed(1)}h remaining</span>
              </div>
            </div>
          )}

          {/* Add entry form */}
          {showForm && (
            <div className="border-b border-slate-100 px-6 py-4 space-y-3 bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Description *</label>
                  <input value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Social media management"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Hours</label>
                  <input type="number" min="0" step="0.5" value={hours} onChange={e => setHours(e.target.value)}
                    placeholder="e.g. 3.5"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Amount (EGP) *</label>
                  <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="button" onClick={handleAddEntry} disabled={!description.trim() || !amount || isPending}
                  className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
                  {isPending ? 'Adding…' : 'Add Entry'}
                </button>
              </div>
            </div>
          )}

          {/* Entries list */}
          {entries.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-slate-400">No work logged yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {entries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{entry.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(entry.date)}{entry.hours ? ` · ${entry.hours}h` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{formatEGP(entry.amount)}</p>
                      <button type="button" onClick={() => handleDelete(entry.id)} disabled={isPending}
                        className="rounded-lg p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-slate-100 flex justify-between">
                <span className="text-sm text-slate-500">Total logged</span>
                <span className="text-sm font-semibold text-slate-900">{formatEGP(totalLogged)}</span>
              </div>
            </>
          )}
        </>
      )}

      {!isRetainer && (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-slate-400">Toggle on to track hours and log work for this retainer invoice.</p>
        </div>
      )}
    </div>
  )
}
