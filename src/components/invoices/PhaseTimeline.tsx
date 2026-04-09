'use client'

import { useTransition } from 'react'
import { markPhasePaidAction } from '@/lib/actions/invoices'
import { formatEGP, formatDate } from '@/lib/format'
import PhaseWorkStatus from './PhaseWorkStatus'

type WS = 'PENDING' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DELIVERED'

interface Phase {
  id: string
  name: string
  amount: number
  dueDate: Date | string
  paidDate: Date | string | null
  status: string
  workStatus: WS
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
  const paidCount   = phases.filter(p => p.status === 'PAID').length
  const totalCount  = phases.length
  const paidAmount  = phases.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
  const remaining   = invoiceTotal - paidAmount
  const progressPct = totalCount > 0 ? (paidCount / totalCount) * 100 : 0
  const now         = new Date()

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-slate-900">Payment Schedule</h2>
          <span className="text-sm text-slate-500">{paidCount} of {totalCount} phases paid</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Paid: <span className="font-medium text-emerald-600">{formatEGP(paidAmount)}</span></span>
          <span>Remaining: <span className="font-medium text-slate-700">{formatEGP(remaining)}</span></span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {phases.map(phase => (
          <PhaseRow
            key={phase.id}
            phase={phase}
            isOverdue={phase.status === 'UNPAID' && new Date(phase.dueDate) < now}
          />
        ))}
      </div>
    </div>
  )
}

function PhaseRow({ phase, isOverdue }: { phase: Phase; isOverdue: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className={`px-6 py-4 ${isOverdue ? 'bg-red-50/40' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            phase.status === 'PAID' ? 'bg-emerald-500' : isOverdue ? 'bg-red-400' : 'bg-slate-300'
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

        <div className="flex shrink-0 items-center gap-2">
          {/* Work status — only for unpaid phases */}
          {phase.status !== 'PAID' && (
            <PhaseWorkStatus phaseId={phase.id} initial={phase.workStatus} />
          )}

          <p className="text-sm font-semibold text-slate-900">{formatEGP(phase.amount)}</p>

          {phase.status === 'PAID' ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Paid
            </span>
          ) : (
            <button
              onClick={() => startTransition(() => markPhasePaidAction(phase.id))}
              disabled={pending}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {pending ? '…' : 'Mark Paid'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
