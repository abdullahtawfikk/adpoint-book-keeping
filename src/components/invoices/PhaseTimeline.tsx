'use client'

import { useTransition } from 'react'
import { markPhasePaidAction } from '@/lib/actions/invoices'
import { formatEGP, formatDate } from '@/lib/format'

interface Phase {
  id: string
  name: string
  amount: number
  dueDate: Date | string
  paidDate: Date | string | null
  status: string
  sortOrder: number
}

export default function PhaseTimeline({
  invoiceId,
  invoiceTotal,
  phases,
}: {
  invoiceId: string
  invoiceTotal: number
  phases: Phase[]
}) {
  const paidCount = phases.filter((p) => p.status === 'PAID').length
  const totalCount = phases.length
  const paidAmount = phases.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
  const remaining = invoiceTotal - paidAmount
  const progressPct = totalCount > 0 ? (paidCount / totalCount) * 100 : 0
  const now = new Date()

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-slate-900">Payment Schedule</h2>
          <span className="text-sm text-slate-500">{paidCount} of {totalCount} phases paid</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Paid: <span className="font-medium text-emerald-600">{formatEGP(paidAmount)}</span></span>
          <span>Remaining: <span className="font-medium text-slate-700">{formatEGP(remaining)}</span></span>
        </div>
      </div>

      {/* Phases list */}
      <div className="divide-y divide-slate-100">
        {phases.map((phase) => {
          const isOverdue = phase.status === 'UNPAID' && new Date(phase.dueDate) < now
          return (
            <PhaseRow
              key={phase.id}
              phase={phase}
              isOverdue={isOverdue}
              invoiceId={invoiceId}
            />
          )
        })}
      </div>
    </div>
  )
}

function PhaseRow({
  phase,
  isOverdue,
  invoiceId,
}: {
  phase: Phase
  isOverdue: boolean
  invoiceId: string
}) {
  const [pending, startTransition] = useTransition()

  function handleMarkPaid() {
    startTransition(async () => {
      await markPhasePaidAction(phase.id)
    })
  }

  return (
    <div className={`flex items-center justify-between px-6 py-4 ${isOverdue ? 'bg-red-50/40' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          phase.status === 'PAID' ? 'bg-emerald-500' :
          isOverdue ? 'bg-red-400' : 'bg-slate-300'
        }`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{phase.name}</p>
          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
            Due {formatDate(phase.dueDate)}
            {isOverdue && ' · Overdue'}
            {phase.status === 'PAID' && phase.paidDate && ` · Paid ${formatDate(phase.paidDate)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <p className="text-sm font-semibold text-slate-900">{formatEGP(phase.amount)}</p>
        {phase.status === 'PAID' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            Paid
          </span>
        ) : (
          <button
            onClick={handleMarkPaid}
            disabled={pending}
            className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors"
          >
            {pending ? '...' : 'Mark Paid'}
          </button>
        )}
      </div>
    </div>
  )
}
