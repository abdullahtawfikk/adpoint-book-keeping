'use client'

import { useState } from 'react'
import { formatDate, formatEGP } from '@/lib/format'
import PayNowButton from './PayNowButton'
import type { Invoice } from './PortalView'

/* ── Status config ──────────────────────────────── */

interface StatusConfig {
  stripe: string
  badge: string
  label: string
  dot: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT:          { stripe: 'bg-zinc-300',    badge: 'bg-zinc-100 text-zinc-500',       dot: 'bg-zinc-300',    label: 'Draft' },
  SENT:           { stripe: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700',        dot: 'bg-blue-500',    label: 'Sent' },
  PARTIALLY_PAID: { stripe: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700',      dot: 'bg-amber-400',   label: 'Partial' },
  PAID:           { stripe: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500', label: 'Paid' },
  OVERDUE:        { stripe: 'bg-red-500',     badge: 'bg-red-50 text-red-600',          dot: 'bg-red-500',     label: 'Overdue' },
  CANCELLED:      { stripe: 'bg-zinc-200',    badge: 'bg-zinc-100 text-zinc-400',       dot: 'bg-zinc-200',    label: 'Cancelled' },
}

const PAYABLE_STATUSES = new Set(['SENT', 'OVERDUE', 'PARTIALLY_PAID'])

/* ── Props ──────────────────────────────────────── */

interface InvoiceCardProps {
  invoice: Invoice
  portalToken: string
  defaultExpanded?: boolean
}

/* ── Component ──────────────────────────────────── */

export default function InvoiceCard({ invoice, portalToken, defaultExpanded = false }: InvoiceCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const cfg = STATUS_CONFIG[invoice.displayStatus] ?? STATUS_CONFIG.DRAFT
  const hasSchedule = invoice.phases.length > 0
  const isPayable = PAYABLE_STATUSES.has(invoice.displayStatus)

  const unpaidPhaseTotal = invoice.phases
    .filter((p) => p.status === 'UNPAID')
    .reduce((sum, p) => sum + p.amount, 0)

  const paidPhaseTotal = invoice.phases
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)

  const balanceDue = hasSchedule ? unpaidPhaseTotal : invoice.total

  const paidPhaseCount = invoice.phases.filter((p) => p.status === 'PAID').length
  const totalPhaseCount = invoice.phases.length

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.06),0_1px_2px_-1px_rgb(0,0,0,0.04)]">

      {/* Status stripe */}
      <div className={`h-[3px] w-full ${cfg.stripe}`} />

      {/* Card header — always visible, tap to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 pt-4 pb-4 text-left sm:px-5"
      >
        <div className="min-w-0 flex-1">
          {/* Invoice number + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-zinc-900">{invoice.number}</span>
            <StatusBadge config={cfg} />
          </div>

          {/* Title */}
          {invoice.title && (
            <p className="mt-0.5 truncate text-sm text-zinc-500">{invoice.title}</p>
          )}

          {/* Due date + phase progress */}
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-zinc-400">Due {formatDate(invoice.dueDate)}</span>
            {hasSchedule && totalPhaseCount > 0 && (
              <span className="text-xs text-zinc-400">
                {paidPhaseCount}/{totalPhaseCount} phases paid
              </span>
            )}
          </div>

          {/* Phase progress bar */}
          {hasSchedule && totalPhaseCount > 0 && (
            <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(paidPhaseTotal / invoice.total) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Amount + chevron */}
        <div className="flex shrink-0 items-start gap-3">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              {hasSchedule ? 'Remaining' : 'Total'}
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-900">
              {formatEGP(balanceDue)}
            </p>
          </div>
          <ChevronIcon expanded={expanded} />
        </div>
      </button>

      {/* Expandable body */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-zinc-100 px-4 py-4 sm:px-5">

          {/* Download PDF */}
          <a
            href={`/api/portal/${portalToken}/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            <DownloadIcon />
            Download PDF
          </a>

          {/* Pay Now — simple invoice */}
          {isPayable && !hasSchedule && (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <PayNowButton amount={invoice.total} />
            </div>
          )}

          {/* Phase schedule */}
          {hasSchedule && (
            <div className="mt-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Payment Schedule
              </p>
              <PhaseList phases={invoice.phases} />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

/* ── Phase list ─────────────────────────────────── */

function PhaseList({ phases }: { phases: Invoice['phases'] }) {
  return (
    <div className="space-y-2">
      {phases.map((phase, idx) => {
        const isOverdue = phase.status === 'UNPAID' && new Date(phase.dueDate) < new Date()
        const isPaid = phase.status === 'PAID'
        const isLast = idx === phases.length - 1

        return (
          <div key={phase.id} className="flex gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center pt-0.5">
              <div
                className={`z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isPaid
                    ? 'border-emerald-500 bg-emerald-500'
                    : isOverdue
                      ? 'border-red-400 bg-red-50'
                      : 'border-zinc-300 bg-white'
                }`}
              >
                {isPaid ? (
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isOverdue ? (
                  <svg className="h-2.5 w-2.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01" />
                  </svg>
                ) : null}
              </div>
              {!isLast && (
                <div className={`mt-1 w-px flex-1 ${isPaid ? 'bg-emerald-200' : 'bg-zinc-200'}`} style={{ minHeight: '24px' }} />
              )}
            </div>

            {/* Phase content */}
            <div className="min-w-0 flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-zinc-900">{phase.name}</p>
                    <PhaseStatusBadge isPaid={isPaid} isOverdue={isOverdue} />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">Due {formatDate(phase.dueDate)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums text-zinc-900">{formatEGP(phase.amount)}</p>
                  {isPaid && (
                    <p className="mt-0.5 text-xs font-medium text-emerald-600">Received</p>
                  )}
                </div>
              </div>

              {/* Pay now for unpaid phase */}
              {!isPaid && (
                <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <PayNowButton amount={phase.amount} compact />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Micro-components ───────────────────────────── */

function StatusBadge({ config }: { config: StatusConfig }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function PhaseStatusBadge({ isPaid, isOverdue }: { isPaid: boolean; isOverdue: boolean }) {
  if (isPaid) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
        Paid
      </span>
    )
  }
  if (isOverdue) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
        Overdue
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">
      Pending
    </span>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
