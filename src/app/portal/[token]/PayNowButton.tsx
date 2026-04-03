'use client'

import { formatEGP } from '@/lib/format'
import { getInstaPayURL } from '@/lib/instapay'

interface PayNowButtonProps {
  amount: number
  compact?: boolean
}

export default function PayNowButton({ amount, compact = false }: PayNowButtonProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          Pay <span className="font-semibold text-zinc-800">{formatEGP(amount)}</span>
        </p>
        <a
          href={getInstaPayURL(amount)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
        >
          Open InstaPay
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Amount due</span>
        <span className="text-xl font-bold tabular-nums text-white">{formatEGP(amount)}</span>
      </div>
      <a
        href={getInstaPayURL(amount)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-4 text-sm font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
      >
        Open InstaPay
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}
