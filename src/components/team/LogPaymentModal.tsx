'use client'

import { useState, useTransition } from 'react'
import Modal from '@/components/ui/Modal'
import { logTeamPaymentAction } from '@/lib/actions/team'

interface Member {
  id: string
  name: string
  role: string | null
}

export default function LogPaymentModal({ member }: { member: Member }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return }
    setError('')
    startTransition(async () => {
      try {
        await logTeamPaymentAction({
          memberId: member.id,
          memberName: member.name,
          memberRole: member.role ?? undefined,
          amount: amt,
          date,
          description: description || undefined,
        })
        setOpen(false)
        setAmount('')
        setDescription('')
      } catch {
        setError('Something went wrong.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
      >
        Log Payment
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Log Payment — ${member.name}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (EGP) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
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
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. March salary, project bonus"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Logging...' : 'Log Payment'}
          </button>
        </form>
      </Modal>
    </>
  )
}
