'use client'

import { useState, useCallback } from 'react'
import { formatDate, formatEGP } from '@/lib/format'
import { getInstaPayURL } from '@/lib/instapay'
import ClaimPaymentForm from './ClaimPaymentForm'
import { useLanguage } from './LanguageContext'
import type { Invoice } from './PortalView'

const WORK_STATUS_CONFIG = {
  PENDING:      { label: 'Pending',       color: 'bg-zinc-100 text-zinc-500' },
  IN_PROGRESS:  { label: 'In Progress',   color: 'bg-blue-50 text-blue-700' },
  UNDER_REVIEW: { label: 'Under Review',  color: 'bg-amber-50 text-amber-700' },
  DELIVERED:    { label: 'Delivered',     color: 'bg-emerald-50 text-emerald-700' },
} as const

/* ── Status config ──────────────────────────────────────────── */

interface StatusConfig {
  border: string
  badge: string
  dot: string
  label: (t: ReturnType<typeof useLanguage>['t']) => string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT:          { border: 'border-l-zinc-200',   badge: 'bg-zinc-100 text-zinc-500',      dot: 'bg-zinc-300',    label: t => t.draft },
  SENT:           { border: 'border-l-blue-400',   badge: 'bg-blue-50 text-blue-700',       dot: 'bg-blue-500',    label: t => t.sent },
  PARTIALLY_PAID: { border: 'border-l-amber-400',  badge: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400',   label: t => t.partial },
  PAID:           { border: 'border-l-emerald-400',badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: t => t.paid },
  OVERDUE:        { border: 'border-l-red-500',    badge: 'bg-red-50 text-red-600',         dot: 'bg-red-500',     label: t => t.overdue },
  CANCELLED:      { border: 'border-l-zinc-200',   badge: 'bg-zinc-100 text-zinc-400',      dot: 'bg-zinc-200',    label: t => t.cancelled },
}

const PAYABLE_STATUSES    = new Set(['SENT', 'OVERDUE', 'PARTIALLY_PAID'])
const APPROVABLE_STATUSES = new Set(['SENT', 'OVERDUE', 'PARTIALLY_PAID', 'PAID'])

/* ── Props ──────────────────────────────────────────────────── */

interface InvoiceCardProps {
  invoice: Invoice
  portalToken: string
  defaultExpanded?: boolean
}

/* ── Component ──────────────────────────────────────────────── */

export default function InvoiceCard({ invoice, portalToken, defaultExpanded = false }: InvoiceCardProps) {
  const { t } = useLanguage()
  const [expanded,       setExpanded]      = useState(defaultExpanded)
  const [approved,       setApproved]      = useState(invoice.clientApproved)
  const [approving,      setApproving]     = useState(false)
  const [showClaimForm,  setShowClaimForm] = useState(false)
  const [claimPhaseId,   setClaimPhaseId]  = useState<string | undefined>()
  const [claimAmount,    setClaimAmount]   = useState(0)
  const [showDispute,    setShowDispute]   = useState(false)
  const [disputeNote,    setDisputeNote]   = useState('')
  const [disputeSending, setDisputeSending]= useState(false)
  const [disputeSent,    setDisputeSent]   = useState(false)

  const cfg          = STATUS_CONFIG[invoice.displayStatus] ?? STATUS_CONFIG.DRAFT
  const hasSchedule  = invoice.phases.length > 0
  const isPayable    = PAYABLE_STATUSES.has(invoice.displayStatus)
  const isApprovable = APPROVABLE_STATUSES.has(invoice.displayStatus) && !approved

  const unpaidPhaseTotal = invoice.phases.filter(p => p.status === 'UNPAID').reduce((sum, p) => sum + p.amount, 0)
  const paidPhaseTotal   = invoice.phases.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
  const balanceDue       = hasSchedule ? unpaidPhaseTotal : invoice.total

  const paidPhaseCount  = invoice.phases.filter(p => p.status === 'PAID').length
  const totalPhaseCount = invoice.phases.length

  async function handleApprove() {
    if (approving || approved) return
    setApproving(true)
    try {
      const res = await fetch(`/api/portal/${portalToken}/approve`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ invoiceId: invoice.id }),
      })
      if (res.ok) setApproved(true)
    } finally {
      setApproving(false)
    }
  }

  async function handleDispute() {
    if (!disputeNote.trim() || disputeSending) return
    setDisputeSending(true)
    try {
      await fetch(`/api/portal/${portalToken}/dispute`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ invoiceId: invoice.id, note: disputeNote }),
      })
      setDisputeSent(true)
      setShowDispute(false)
      setDisputeNote('')
    } finally {
      setDisputeSending(false)
    }
  }

  const openClaim = useCallback((phaseId?: string, amount?: number) => {
    setClaimPhaseId(phaseId)
    setClaimAmount(amount ?? balanceDue)
    setShowClaimForm(true)
  }, [balanceDue])

  return (
    <article className={`overflow-hidden rounded-2xl border-l-4 bg-white shadow-sm ${cfg.border}`}>

      {/* Approved bar */}
      {approved && (
        <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2.5">
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs font-semibold text-emerald-700">{t.invoiceApproved}</p>
        </div>
      )}

      {/* Card header — tap to expand/collapse */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left active:bg-zinc-50 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-zinc-900">{invoice.number}</span>
            <StatusBadge cfg={cfg} t={t} />
          </div>
          {invoice.title && <p className="mt-0.5 truncate text-sm text-zinc-500">{invoice.title}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-zinc-400">{t.due} {formatDate(invoice.dueDate)}</span>
            {hasSchedule && totalPhaseCount > 0 && (
              <span className="text-xs text-zinc-400">{paidPhaseCount}/{totalPhaseCount} {t.phases}</span>
            )}
          </div>
          {hasSchedule && totalPhaseCount > 0 && (
            <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(paidPhaseTotal / invoice.total) * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              {hasSchedule ? t.remaining : t.total}
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-zinc-900">{formatEGP(balanceDue)}</p>
          </div>
          <ChevronIcon expanded={expanded} />
        </div>
      </button>

      {/* Expanded body */}
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
        expanded ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="space-y-3 border-t border-zinc-100 px-4 py-4 sm:px-5">

          {/* Payment section — simple invoice */}
          {isPayable && !hasSchedule && !showClaimForm && (
            <PaymentBlock
              amount={invoice.total}
              onClaim={() => openClaim(undefined, invoice.total)}
              t={t}
            />
          )}

          {/* Claim form — simple invoice */}
          {isPayable && !hasSchedule && showClaimForm && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <ClaimPaymentForm
                portalToken={portalToken}
                invoiceId={invoice.id}
                phaseId={claimPhaseId}
                amount={claimAmount}
                onSuccess={() => setShowClaimForm(false)}
                onCancel={() => setShowClaimForm(false)}
              />
            </div>
          )}

          {/* Phase list */}
          {hasSchedule && (
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                {t.paymentSchedule}
              </p>
              <PhaseList
                phases={invoice.phases}
                invoiceId={invoice.id}
                portalToken={portalToken}
                showClaimForm={showClaimForm}
                claimPhaseId={claimPhaseId}
                onOpenClaim={openClaim}
                onClaimSuccess={() => setShowClaimForm(false)}
                onClaimCancel={() => setShowClaimForm(false)}
                t={t}
              />
            </div>
          )}

          {/* Deliverables */}
          {invoice.deliverables.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Files &amp; Deliverables</p>
              </div>
              <div className="divide-y divide-zinc-100">
                {invoice.deliverables.map(d => (
                  <a
                    key={d.id}
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-lg shrink-0">{d.fileType?.startsWith('image') ? '🖼' : d.fileType?.includes('pdf') ? '📄' : d.fileType?.includes('video') ? '🎬' : '📎'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 truncate">{d.name}</p>
                      {d.description && <p className="text-xs text-zinc-400 mt-0.5 truncate">{d.description}</p>}
                    </div>
                    <svg className="h-4 w-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Approve + PDF row */}
          <div className="flex gap-2">
            {isApprovable && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
              >
                {approving ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {t.approveInvoice}
              </button>
            )}
            <a
              href={`/api/portal/${portalToken}/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 ${isApprovable ? 'px-4' : 'flex-1'}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {!isApprovable && <span>{t.downloadPdf}</span>}
            </a>
          </div>

          {/* Dispute */}
          {disputeSent ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Dispute submitted — we'll look into it shortly.
            </div>
          ) : showDispute ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-700">Describe the issue</p>
              <textarea
                value={disputeNote}
                onChange={e => setDisputeNote(e.target.value)}
                placeholder="What's wrong with this invoice?"
                rows={3}
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-amber-400 resize-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDispute(false)} className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancel</button>
                <button type="button" onClick={handleDispute} disabled={!disputeNote.trim() || disputeSending} className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">{disputeSending ? 'Sending…' : 'Submit'}</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDispute(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              Report an issue with this invoice
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

/* ── 2-step payment block ─────────────────────────────────── */

function PaymentBlock({ amount, onClaim, t }: {
  amount: number
  onClaim: () => void
  t: ReturnType<typeof useLanguage>['t']
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200">
      {/* Step 1 */}
      <div className="bg-zinc-50 px-4 pt-4 pb-3">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">1</span>
          <p className="text-xs font-semibold text-zinc-700">{t.payStep1}</p>
        </div>
        <a
          href={getInstaPayURL(amount)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
        >
          Open InstaPay · {formatEGP(amount)}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 border-t border-zinc-200 px-4 py-2.5">
        <div className="flex-1 border-t border-zinc-200" />
        <p className="text-[11px] font-medium text-zinc-400">after paying</p>
        <div className="flex-1 border-t border-zinc-200" />
      </div>

      {/* Step 2 */}
      <div className="px-4 pb-4">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600">2</span>
          <div>
            <p className="text-xs font-semibold text-zinc-700">{t.payStep2}</p>
            <p className="text-[11px] text-zinc-400">{t.payStep2Sub}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClaim}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100"
        >
          <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {t.iPaid} — {t.submitClaim}
        </button>
      </div>
    </div>
  )
}

/* ── Phase list ─────────────────────────────────────────────── */

function PhaseList({
  phases,
  invoiceId,
  portalToken,
  showClaimForm,
  claimPhaseId,
  onOpenClaim,
  onClaimSuccess,
  onClaimCancel,
  t,
}: {
  phases: Invoice['phases']
  invoiceId: string
  portalToken: string
  showClaimForm: boolean
  claimPhaseId: string | undefined
  onOpenClaim: (phaseId?: string, amount?: number) => void
  onClaimSuccess: () => void
  onClaimCancel: () => void
  t: ReturnType<typeof useLanguage>['t']
}) {
  return (
    <div className="space-y-2">
      {phases.map((phase, idx) => {
        const isOverdue = phase.status === 'UNPAID' && new Date(phase.dueDate) < new Date()
        const isPaid    = phase.status === 'PAID'
        const isLast    = idx === phases.length - 1
        const showThis  = showClaimForm && claimPhaseId === phase.id

        return (
          <div key={phase.id} className="flex gap-3">
            {/* Timeline dot */}
            <div className="flex flex-col items-center pt-0.5">
              <div className={`z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                isPaid    ? 'border-emerald-500 bg-emerald-500' :
                isOverdue ? 'border-red-400 bg-red-50' :
                            'border-zinc-300 bg-white'
              }`}>
                {isPaid && (
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {!isPaid && isOverdue && (
                  <svg className="h-2.5 w-2.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01" />
                  </svg>
                )}
              </div>
              {!isLast && (
                <div className={`mt-1 w-px flex-1 ${isPaid ? 'bg-emerald-200' : 'bg-zinc-200'}`} style={{ minHeight: '24px' }} />
              )}
            </div>

            {/* Phase content */}
            <div className="min-w-0 flex-1 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-zinc-900">{phase.name}</p>
                    <PhaseStatusBadge isPaid={isPaid} isOverdue={isOverdue} t={t} />
                    {!isPaid && (
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${WORK_STATUS_CONFIG[phase.workStatus].color}`}>
                        {WORK_STATUS_CONFIG[phase.workStatus].label}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">{t.due} {formatDate(phase.dueDate)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-zinc-900">{formatEGP(phase.amount)}</p>
                  {isPaid && <p className="mt-0.5 text-xs font-medium text-emerald-600">{t.received}</p>}
                </div>
              </div>

              {/* Unpaid phase — payment block */}
              {!isPaid && !showThis && (
                <div className="mt-2.5 overflow-hidden rounded-xl border border-zinc-200">
                  {/* Step 1 */}
                  <div className="bg-zinc-50 px-3 pt-3 pb-2.5">
                    <a
                      href={getInstaPayURL(phase.amount)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                    >
                      Open InstaPay · {formatEGP(phase.amount)}
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  {/* Step 2 */}
                  <div className="border-t border-zinc-200 px-3 pb-3 pt-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenClaim(phase.id, phase.amount)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.iPaid} — {t.submitClaim}
                    </button>
                  </div>
                </div>
              )}

              {/* Claim form inline */}
              {!isPaid && showThis && (
                <div className="mt-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <ClaimPaymentForm
                    portalToken={portalToken}
                    invoiceId={invoiceId}
                    phaseId={phase.id}
                    amount={phase.amount}
                    onSuccess={onClaimSuccess}
                    onCancel={onClaimCancel}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Micro-components ───────────────────────────────────────── */

function StatusBadge({ cfg, t }: { cfg: StatusConfig; t: ReturnType<typeof useLanguage>['t'] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label(t)}
    </span>
  )
}

function PhaseStatusBadge({ isPaid, isOverdue, t }: { isPaid: boolean; isOverdue: boolean; t: ReturnType<typeof useLanguage>['t'] }) {
  if (isPaid)    return <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{t.paid}</span>
  if (isOverdue) return <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">{t.overdue}</span>
  return         <span className="inline-flex items-center rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">{t.pending}</span>
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
