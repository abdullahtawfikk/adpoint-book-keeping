'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { formatEGP } from '@/lib/format'
import InvoiceCard from './InvoiceCard'
import { LanguageProvider, useLanguage } from './LanguageContext'

/* ── Types ──────────────────────────────────────────��───────── */

export interface Phase {
  id: string
  name: string
  amount: number
  dueDate: string
  status: 'PAID' | 'UNPAID'
}

export interface Invoice {
  id: string
  number: string
  title: string | null
  total: number
  dueDate: string
  displayStatus: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  phases: Phase[]
  clientApproved: boolean
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
  totalInvoiced: number
  totalPaid: number
  outstanding: number
}

/* ── Filter ─────────────────────────────────────────────────── */

type Filter = 'all' | 'unpaid' | 'paid'

const UNPAID_STATUSES = new Set(['SENT', 'OVERDUE', 'PARTIALLY_PAID'])
const PAID_STATUSES   = new Set(['PAID'])
const OVERDUE_STATUSES = new Set(['OVERDUE'])

function filterInvoices(invoices: Invoice[], filter: Filter): Invoice[] {
  if (filter === 'unpaid') return invoices.filter(inv => UNPAID_STATUSES.has(inv.displayStatus))
  if (filter === 'paid')   return invoices.filter(inv => PAID_STATUSES.has(inv.displayStatus))
  return invoices
}

/* ── Root export — wraps everything in LanguageProvider ─────── */

export default function PortalView(props: PortalViewProps) {
  return (
    <LanguageProvider>
      <PortalViewInner {...props} />
    </LanguageProvider>
  )
}

/* ── Inner component (has language context) ─────────────────── */

function PortalViewInner({
  clientName,
  clientCompany,
  bizName,
  bizEmail,
  bizPhone,
  bizLogoUrl,
  portalToken,
  invoices,
  totalInvoiced,
  totalPaid,
  outstanding,
}: PortalViewProps) {
  const { t, lang, toggle: toggleLang, isRTL } = useLanguage()
  const [filter,          setFilter]          = useState<Filter>('all')
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  // Track portal view
  useEffect(() => {
    fetch(`/api/portal/${portalToken}/track-view`, { method: 'POST' }).catch(() => {})
  }, [portalToken])

  // Sticky mini-header on scroll
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
  const unpaidCount   = invoices.filter(inv => UNPAID_STATUSES.has(inv.displayStatus)).length
  const paidCount     = invoices.filter(inv => PAID_STATUSES.has(inv.displayStatus)).length
  const overdueInvs   = invoices.filter(inv => OVERDUE_STATUSES.has(inv.displayStatus))
  const hasOutstanding = outstanding > 0

  const initials = bizName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'B'

  return (
    <div className="min-h-screen bg-[#F5F5F7]">

      {/* ── Overdue banner ────────────────────────────────────── */}
      {overdueInvs.length > 0 && (
        <div className="bg-red-600 px-4 py-3">
          <div className="mx-auto flex max-w-lg items-center gap-2.5">
            <svg className="h-4 w-4 shrink-0 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs font-semibold text-white">
              {overdueInvs.length === 1
                ? `Invoice ${overdueInvs[0].number} is overdue — please settle your balance.`
                : `${overdueInvs.length} invoices are overdue — please settle your balance.`
              }
            </p>
          </div>
        </div>
      )}

      {/* ── Sticky mini-header ────────────────────────────────── */}
      <div
        className={`fixed inset-x-0 top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-md transition-all duration-300 ${
          headerCollapsed ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            {bizLogoUrl ? (
              <Image src={bizLogoUrl} alt={bizName} width={22} height={22} className="rounded object-contain" />
            ) : (
              <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded bg-zinc-900 text-[9px] font-bold text-white">
                {initials}
              </div>
            )}
            <span className="text-sm font-medium text-zinc-800">{clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasOutstanding && (
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white tabular-nums">
                {formatEGP(outstanding)}
              </span>
            )}
            <LangToggle lang={lang} onToggle={toggleLang} />
          </div>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div ref={heroRef} className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-lg px-4 pt-7 pb-6 sm:px-6">

          {/* Top row: brand + lang toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              {bizLogoUrl ? (
                <Image src={bizLogoUrl} alt={bizName} width={32} height={32} className="rounded-lg object-contain" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[10px] font-bold tracking-wide text-white">
                  {initials}
                </div>
              )}
              <span className="text-sm font-semibold text-zinc-500">{bizName}</span>
            </div>
            <LangToggle lang={lang} onToggle={toggleLang} />
          </div>

          {/* Client identity */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              {t.clientPortal}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">{clientName}</h1>
            {clientCompany && <p className="mt-0.5 text-sm text-zinc-500">{clientCompany}</p>}
          </div>

          {/* Outstanding balance */}
          <div
            className={`relative overflow-hidden rounded-2xl p-5 ${
              hasOutstanding ? 'bg-zinc-900 text-white' : 'bg-emerald-50 border border-emerald-200'
            }`}
          >
            {hasOutstanding && (
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
            )}
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

          {/* Stats + statement */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatPill label={t.totalInvoiced} value={formatEGP(totalInvoiced)} />
            <StatPill label={t.totalPaid} value={formatEGP(totalPaid)} highlight={totalPaid > 0} />
          </div>

          {/* Download statement */}
          <a
            href={`/api/portal/${portalToken}/statement`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t.downloadStatement}
          </a>
        </div>
      </div>

      {/* ── Invoice list ──────────────────────────────────────── */}
      <div className="mx-auto max-w-lg px-4 py-5 sm:px-6">

        {invoices.length > 0 && (
          <div className="mb-4 flex gap-1.5 rounded-xl bg-zinc-200/60 p-1">
            <FilterTab label={t.all}    count={invoices.length} active={filter === 'all'}    onSelect={() => setFilter('all')} />
            <FilterTab label={t.unpaid} count={unpaidCount}     active={filter === 'unpaid'} onSelect={() => setFilter('unpaid')} />
            <FilterTab label={t.paid}   count={paidCount}       active={filter === 'paid'}   onSelect={() => setFilter('paid')} />
          </div>
        )}

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

        <footer className="mt-8 pb-8 text-center">
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

function FilterTab({
  label, count, active, onSelect,
}: { label: string; count: number; active: boolean; onSelect: () => void }) {
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
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

function StatPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${highlight ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-100 bg-white'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${highlight ? 'text-emerald-600' : 'text-zinc-400'}`}>
        {label}
      </p>
      <p className={`mt-1 text-base font-bold tabular-nums ${highlight ? 'text-emerald-700' : 'text-zinc-900'}`}>
        {value}
      </p>
    </div>
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
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-14 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
        <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm text-zinc-400">{messages[filter]}</p>
    </div>
  )
}
