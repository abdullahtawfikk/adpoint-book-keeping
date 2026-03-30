'use client'

import { useState, useTransition } from 'react'
import Modal from '@/components/ui/Modal'
import { recordPaymentAction } from '@/lib/actions/invoices'
import { formatEGP } from '@/lib/format'

const METHODS = ['Cash', 'Bank Transfer', 'Instapay', 'Cheque', 'Other']

export default function RecordPaymentModal({
  invoiceId,
  invoiceTotal,
  amountPaid,
}: {
  invoiceId: string
  invoiceTotal: number
  amountPaid: number
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const remaining = invoiceTotal - amountPaid
  const [amount, setAmount] = useState(String(remaining > 0 ? remaining : invoiceTotal))
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState(METHODS[0])
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return }
    setError('')
    startTransition(async () => {
      try {
        await recordPaymentAction(invoiceId, { amount: amt, date, method, notes: notes || undefined })
        setOpen(false)
      } catch {
        setError('Something went wrong.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Record Payment
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Record Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Invoice Total</span>
              <span>{formatEGP(invoiceTotal)}</span>
            </div>
            {amountPaid > 0 && (
              <div className="flex justify-between text-slate-600 mt-1">
                <span>Already Paid</span>
                <span className="text-emerald-600">{formatEGP(amountPaid)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-slate-900 mt-1 pt-1 border-t border-slate-200">
              <span>Remaining</span>
              <span>{formatEGP(remaining)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (EGP) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reference number, etc."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Recording...' : 'Record Payment'}
          </button>
        </form>
      </Modal>
    </>
  )
}
