'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { formatEGP, formatDate } from '@/lib/format'
import InvoiceCard from './InvoiceCard'
import PortalContactSection from './PortalContactSection'
import { LanguageProvider, useLanguage } from './LanguageContext'

/* ── Types ─────────────────────────────────────────────────── */

export interface Phase {
  id: string
  name: string
  amount: number
  dueDate: string
  status: 'PAID' | 'UNPAID'
  workStatus: 'PENDING' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DELIVERED'
}

export interface Deliverable {
  id: string
  name: string
  description: string | null
  fileUrl: string
  fileType: string | null
}

export interface Invoice {
  id: string
  number: string
  title: string | null
  total: number
  dueDate: string
  displayStatus: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  phases: Phase[]
  deliverables: Deliverable[]
  clientApproved: boolean
}

export interface PortalProposal {
  id: string
  title: string
  description: string | null
  items: { description: string; quantity: number; unitPrice: number; total: number }[]
  total: number
  status: 'SENT' | 'ACCEPTED' | 'CHANGES_REQUESTED' | 'REJECTED'
  clientNote: string | null
  validUntil: string | null
  createdAt: string
}

export interface PortalViewProps {
  clientName: string
  clientCompany: string | null
  bizName: string
  bizEmail: string | null
  bizPhone: string | null
  bizLogoUrl: string | null
  portalToken: string
  invoices: Invoice[]
  proposals: PortalProposal[]
  totalInvoiced: number
  totalPaid: number
  outstanding: number
}

/* ── Filter ─────────────────────────────────────────────────── */

type Filter = 'all' | 'unpaid' | 'paid'

const UNPAID_STATUSES  = new Set(['SENT', 'OVERDUE', 'PARTIALLY_PAID'])
const PAID_STATUSES    = new Set(['PAID'])
const OVERDUE_STATUSES = new Set(['OVERDUE'])

function filterInvoices(invoices: Invoice[], filter: Filter): Invoice[] {
  if (filter === 'unpaid') return invoices.filter(inv => UNPAID_STATUSES.has(inv.displayStatus))
  if (filter === 'paid')   return invoices.filter(inv => PAID_STATUSES.has(inv.displayStatus))
  return invoices
}

/* ── Root ─────────────────────────────────────────────────── */

export default function PortalView(props: PortalViewProps) {
  return (
    <LanguageProvider>
      <PortalViewInner {...props} />
    </LanguageProvider>
  )
}

/* ── Inner ─────────────────────────────────────────────────── */

function PortalViewInner({
  clientName,
  clientCompany,
  bizName,
  bizEmail,
  bizPhone,
  bizLogoUrl,
  portalToken,
  invoices,
  proposals,
  totalInvoiced,
  totalPaid,
  outstanding,
}: PortalViewProps) {
  const { t, lang, toggle: toggleLang } = useLanguage()
  const [filter,          setFilter]          = useState<Filter>('all')
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/portal/${portalToken}/track-view`, { method: 'POST' }).catch(() => {})
  }, [portalToken])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const obs = new IntersectionObserver(
      ([entry]) => setHeaderCollapsed(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' },
    )
    obs.observe(hero)
    return () => obs.disconnect()
  }, [])

  const visible       = filterInvoices(invoices, filter)
  const unpaidInvs    = invoices.filter(inv => UNPAID_STATUSES.has(inv.displayStatus))
  const paidCount     = invoices.filter(inv => PAID_STATUSES.has(inv.displayStatus)).length
  const overdueInvs   = invoices.filter(inv => OVERDUE_STATUSES.has(inv.displayStatus))
  const hasOutstanding = outstanding > 0

  const initials = bizName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'B'

  return (
    <div className="min-h-screen bg-[#F5F5F7]">

      {/* ── Overdue banner ──────────────────────────────────── */}
      {overdueInvs.length > 0 && (
        <div className="bg-red-600 px-4 py-3">
          <div className="mx-auto flex max-w-lg items-center gap-2.5">
            <svg className="h-4 w-4 shrink-0 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs font-semibold text-white">
              {overdueInvs.length === 1
                ? `Invoice ${overdueInvs[0].number} is overdue — please settle your balance.`
                : `${overdueInvs.length} invoices are overdue — please settle your balance.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Sticky mini-header ──────────────────────────────── */}
      <div className={`fixed inset-x-0 top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-md transition-all duration-300 ${
        headerCollapsed ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            {bizLogoUrl ? (
              <Image src={bizLogoUrl} alt={bizName} width={22} height={22} className="rounded object-contain" />
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-900 text-[9px] font-bold text-white">{initials}</div>
            )}
            <span className="text-sm font-semibold text-zinc-800">{clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasOutstanding && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 tabular-nums">
                {formatEGP(outstanding)} due
              </span>
            )}
            <LangToggle lang={lang} onToggle={toggleLang} />
          </div>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div ref={heroRef} className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-lg px-4 pt-7 pb-6 sm:px-6">

          {/* Brand + lang */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              {bizLogoUrl ? (
                <Image src={bizLogoUrl} alt={bizName} width={32} height={32} className="rounded-lg object-contain" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[10px] font-bold tracking-wide text-white">{initials}</div>
              )}
              <span className="text-sm font-semibold text-zinc-500">{bizName}</span>
            </div>
            <LangToggle lang={lang} onToggle={toggleLang} />
          </div>

          {/* Client greeting */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{t.clientPortal}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">{clientName}</h1>
            {clientCompany && <p className="mt-0.5 text-sm text-zinc-500">{clientCompany}</p>}
          </div>

          {/* Outstanding balance card */}
          <div className={`relative overflow-hidden rounded-2xl p-5 ${
            hasOutstanding ? 'bg-zinc-900 text-white' : 'bg-emerald-50 border border-emerald-200'
          }`}>
            {hasOutstanding && <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />}
            <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${hasOutstanding ? 'text-zinc-400' : 'text-emerald-600'}`}>
              {t.outstandingBalance}
            </p>
            <p className={`mt-2 text-4xl font-bold tracking-tight tabular-nums ${hasOutstanding ? 'text-white' : 'text-emerald-700'}`}>
              {formatEGP(outstanding)}
            </p>
            {!hasOutstanding && (
              <p className="mt-1 text-sm font-medium text-emerald-600">{t.allSettled}</p>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <StatPill label={t.totalInvoiced} value={formatEGP(totalInvoiced)} />
            <StatPill label={t.totalPaid}     value={formatEGP(totalPaid)} highlight={totalPaid > 0} />
          </div>

          {/* Statement download */}
          <a
            href={`/api/portal/${portalToken}/statement`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t.downloadStatement}
          </a>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="mx-auto max-w-lg px-4 py-5 space-y-5 sm:px-6">

        {/* Contact Us — always visible */}
        <PortalContactSection portalToken={portalToken} />

        {/* Proposals */}
        {proposals.length > 0 && (
          <ProposalsSection proposals={proposals} portalToken={portalToken} />
        )}

        {/* Invoice list */}
        {invoices.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{t.invoices}</p>
            </div>

            {/* Filter tabs */}
            <div className="mb-3 flex gap-1 rounded-xl bg-zinc-200/60 p-1">
              <FilterTab label={t.all}    count={invoices.length}    active={filter === 'all'}    onSelect={() => setFilter('all')} />
              <FilterTab label={t.unpaid} count={unpaidInvs.length}  active={filter === 'unpaid'} onSelect={() => setFilter('unpaid')} />
              <FilterTab label={t.paid}   count={paidCount}          active={filter === 'paid'}   onSelect={() => setFilter('paid')} />
            </div>

            {visible.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              <div className="space-y-3">
                {visible.map(invoice => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    portalToken={portalToken}
                    defaultExpanded={UNPAID_STATUSES.has(invoice.displayStatus)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {invoices.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-14 text-center">
            <p className="text-sm text-zinc-400">{t.noInvoices}</p>
          </div>
        )}

        <footer className="pb-8 text-center">
          <p className="text-xs leading-relaxed text-zinc-400">
            {bizName}
            {bizEmail && (
              <> · <a href={`mailto:${bizEmail}`} className="underline underline-offset-2 hover:text-zinc-600 transition-colors">{bizEmail}</a></>
            )}
            {bizPhone && <> · {bizPhone}</>}
          </p>
        </footer>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function LangToggle({ lang, onToggle }: { lang: 'en' | 'ar'; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors"
    >
      {lang === 'en' ? 'عربي' : 'EN'}
    </button>
  )
}

function FilterTab({ label, count, active, onSelect }: { label: string; count: number; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all duration-150 ${
        active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
          active ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-300/60 text-zinc-500'
        }`}>{count}</span>
      )}
    </button>
  )
}

function StatPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${highlight ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-100 bg-white'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${highlight ? 'text-emerald-600' : 'text-zinc-400'}`}>{label}</p>
      <p className={`mt-1 text-base font-bold tabular-nums ${highlight ? 'text-emerald-700' : 'text-zinc-900'}`}>{value}</p>
    </div>
  )
}

/* ── Proposals section ──────────────────────────────────────── */

const PROPOSAL_STATUS: Record<PortalProposal['status'], { label: string; color: string }> = {
  SENT:              { label: 'Awaiting Your Response', color: 'bg-blue-50 text-blue-700' },
  ACCEPTED:          { label: 'Accepted',               color: 'bg-emerald-50 text-emerald-700' },
  CHANGES_REQUESTED: { label: 'Changes Requested',      color: 'bg-amber-50 text-amber-700' },
  REJECTED:          { label: 'Rejected',               color: 'bg-red-50 text-red-600' },
}

function ProposalsSection({ proposals, portalToken }: { proposals: PortalProposal[]; portalToken: string }) {
  const [expanded, setExpanded] = useState<string | null>(
    proposals.find(p => p.status === 'SENT')?.id ?? null
  )
  const [responding,   setResponding]   = useState<string | null>(null)
  const [note,         setNote]         = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [localStatus,  setLocalStatus]  = useState<Record<string, PortalProposal['status']>>({})
  const [localNote,    setLocalNote]    = useState<Record<string, string | null>>({})

  async function respond(proposalId: string, action: 'ACCEPTED' | 'CHANGES_REQUESTED') {
    setSubmitting(true)
    try {
      await fetch(`/api/portal/${portalToken}/proposal`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ proposalId, action, note: note.trim() || undefined }),
      })
      setLocalStatus(prev => ({ ...prev, [proposalId]: action }))
      setLocalNote(prev => ({ ...prev, [proposalId]: note.trim() || null }))
      setResponding(null)
      setNote('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Proposals</p>
      <div className="space-y-3">
        {proposals.map(p => {
          const status = localStatus[p.id] ?? p.status
          const cfg    = PROPOSAL_STATUS[status]
          const isOpen = expanded === p.id
          const isPendingResponse = status === 'SENT'

          return (
            <div key={p.id} className={`overflow-hidden rounded-2xl bg-white border ${isPendingResponse ? 'border-blue-200' : 'border-zinc-200'} shadow-sm`}>
              <button type="button" onClick={() => setExpanded(e => e === p.id ? null : p.id)}
                className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900">{p.title}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">{formatEGP(p.total)}{p.validUntil ? ` · Valid until ${formatDate(p.validUntil)}` : ''}</p>
                </div>
                <svg className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-100 px-4 pb-4 space-y-3">
                  {p.description && <p className="pt-3 text-sm text-zinc-600">{p.description}</p>}

                  {/* Items */}
                  <div className="overflow-hidden rounded-xl border border-zinc-200">
                    {p.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-50 last:border-0">
                        <span className="text-sm text-zinc-800 flex-1">{item.description}</span>
                        <span className="text-xs text-zinc-400 mx-3">{item.quantity} ×</span>
                        <span className="text-sm font-medium text-zinc-900">{formatEGP(item.total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 bg-zinc-50 border-t border-zinc-100">
                      <span className="text-sm font-semibold text-zinc-900">Total</span>
                      <span className="text-sm font-semibold text-zinc-900">{formatEGP(p.total)}</span>
                    </div>
                  </div>

                  {/* Client note (from previous response) */}
                  {(localNote[p.id] !== undefined ? localNote[p.id] : p.clientNote) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-1">Your Note</p>
                      <p className="text-sm text-amber-900">{localNote[p.id] ?? p.clientNote}</p>
                    </div>
                  )}

                  {/* Response UI */}
                  {isPendingResponse && responding !== p.id && (
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => { setResponding(p.id); setNote('') }}
                        className="flex-1 rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                        Request Changes
                      </button>
                      <button type="button" onClick={() => respond(p.id, 'ACCEPTED')} disabled={submitting}
                        className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors">
                        Accept Proposal
                      </button>
                    </div>
                  )}

                  {isPendingResponse && responding === p.id && (
                    <div className="space-y-2 pt-1">
                      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What changes do you need?" rows={3}
                        className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400" />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setResponding(null)}
                          className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancel</button>
                        <button type="button" onClick={() => respond(p.id, 'CHANGES_REQUESTED')} disabled={submitting || !note.trim()}
                          className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                          {submitting ? 'Sending…' : 'Send Request'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  const { t } = useLanguage()
  const messages: Record<Filter, string> = {
    all:    t.noInvoices,
    unpaid: t.nothingOutstanding,
    paid:   t.noPaidInvoices,
  }
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-12 text-center">
      <p className="text-sm text-zinc-400">{messages[filter]}</p>
    </div>
  )
}
