'use client'

import { useState, useTransition } from 'react'
import { updatePhaseWorkStatusAction } from '@/lib/actions/portal-features'

type WS = 'PENDING' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DELIVERED'

const OPTIONS: { value: WS; label: string; color: string }[] = [
  { value: 'PENDING',       label: 'Pending',        color: 'bg-zinc-100 text-zinc-600' },
  { value: 'IN_PROGRESS',   label: 'In Progress',    color: 'bg-blue-100 text-blue-700' },
  { value: 'UNDER_REVIEW',  label: 'Under Review',   color: 'bg-amber-100 text-amber-700' },
  { value: 'DELIVERED',     label: 'Delivered',      color: 'bg-emerald-100 text-emerald-700' },
]

export default function PhaseWorkStatus({
  phaseId,
  initial,
}: {
  phaseId: string
  initial: WS
}) {
  const [status, setStatus]   = useState<WS>(initial)
  const [open, setOpen]       = useState(false)
  const [isPending, startTransition] = useTransition()

  const current = OPTIONS.find(o => o.value === status)!

  function select(value: WS) {
    setOpen(false)
    if (value === status) return
    setStatus(value)
    startTransition(() => updatePhaseWorkStatusAction(phaseId, value))
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity ${current.color} ${isPending ? 'opacity-50' : 'hover:opacity-80'}`}
      >
        {current.label}
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => select(opt.value)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${opt.value === status ? 'opacity-50' : ''}`}
              >
                <span className={`h-2 w-2 rounded-full ${opt.color.split(' ')[0]}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
