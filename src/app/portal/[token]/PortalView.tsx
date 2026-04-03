'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { formatEGP } from '@/lib/format'
import InvoiceCard from './InvoiceCard'

/* ── Types ─────────────────────────────────────── */

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

/* ── Filter types ───────────────────────────────── */

type Filter = 'all' | 'unpaid' | 'paid'

const UNPAID_STATUSES = new Set(['SENT', 'OVERDUE', 'PARTIALLY_PAID'])
const PAID_STATUSES = new Set(['PAID'])

/* ── Helpers ────────────────────────────────────── */

function filterInvoices(invoices: Invoice[], filter: Filter): Invoice[] {
  if (filter === 'unpaid') return invoices.filter((inv) => UNPAID_STATUSES.has(inv.displayStatus))
  if (filter === 'paid') return invoices.filter((inv) => PAID_STATUSES.has(inv.displayStatus))
  return invoices
}

/* ── Component ──────────────────────────────────── */

export default function PortalView({
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
  const [filter, setFilter] = useState<Filter>('all')
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  // Collapse the hero header once user scrolls past it
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderCollapsed(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  const visible = filterInvoices(invoices, filter)
  const unpaidCount = invoices.filter((inv) => UNPAID_STATUSES.has(inv.displayStatus)).length
  const paidCount = invoices.filter((inv) => PAID_STATUSES.has(inv.displayStatus)).length
  const hasOutstanding = outstanding > 0

  const initials = bizName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'B'

  return (
    <div className="min-h-screen bg-[#F5F5F7]">

      {/* ── Sticky mini-header (appears after hero scrolls out) ── */}
      <div
        className={`fixed inset-x-0 top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-md transition-all duration-300 ${
          headerCollapsed ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            {bizLogoUrl ? (
              <Image src={bizLogoUrl} alt={bizName} width={24} height={24} className="rounded object-contain" />
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-900 text-[9px] font-bold text-white">
                {initials}
              </div>
            )}
            <span className="text-sm font-medium text-zinc-800">{clientName}</span>
          </div>
          {hasOutstanding && (
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white tabular-nums">
              {formatEGP(outstanding)}
            </span>
          )}
        </div>
      </div>

      {/* ── Hero ── */}
      <div ref={heroRef} className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-lg px-4 pt-8 pb-6 sm:px-6">

          {/* Business brand row */}
          <div className="flex items-center gap-2.5 mb-7">
            {bizLogoUrl ? (
              <Image src={bizLogoUrl} alt={bizName} width={32} height={32} className="rounded-lg object-contain" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[10px] font-bold tracking-wide text-white">
                {initials}
              </div>
            )}
            <span className="text-sm font-semibold text-zinc-500">{bizName}</span>
          </div>

          {/* Client identity */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              Client Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
              {clientName}
            </h1>
            {clientCompany && (
              <p className="mt-1 text-sm text-zinc-500">{clientCompany}</p>
            )}
          </div>

          {/* Balance card */}
          <div
            className={`relative overflow-hidden rounded-2xl p-5 ${
              hasOutstanding
                ? 'bg-zinc-900 text-white'
                : 'bg-emerald-50 border border-emerald-200'
            }`}
          >
            {hasOutstanding && (
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
            )}
            <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${hasOutstanding ? 'text-zinc-400' : 'text-emerald-600'}`}>
              Outstanding Balance
            </p>
            <p className={`mt-2 text-4xl font-bold tracking-tight tabular-nums ${hasOutstanding ? 'text-white' : 'text-emerald-700'}`}>
              {formatEGP(outstanding)}
            </p>
            {!hasOutstanding && (
              <p className="mt-1 text-sm font-medium text-emerald-600">All settled — thank you!</p>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatPill label="Total Invoiced" value={formatEGP(totalInvoiced)} />
            <StatPill label="Total Paid" value={formatEGP(totalPaid)} highlight={totalPaid > 0} />
          </div>
        </div>
      </div>

      {/* ── Invoice list ── */}
      <div className="mx-auto max-w-lg px-4 py-5 sm:px-6">

        {/* Filter tabs */}
        {invoices.length > 0 && (
          <div className="mb-4 flex gap-1.5 rounded-xl bg-zinc-200/60 p-1">
            <FilterTab
              label="All"
              count={invoices.length}
              active={filter === 'all'}
              onSelect={() => setFilter('all')}
            />
            <FilterTab
              label="Unpaid"
              count={unpaidCount}
              active={filter === 'unpaid'}
              onSelect={() => setFilter('unpaid')}
            />
            <FilterTab
              label="Paid"
              count={paidCount}
              active={filter === 'paid'}
              onSelect={() => setFilter('paid')}
            />
          </div>
        )}

        {/* Invoice cards */}
        {visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-3">
            {visible.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                portalToken={portalToken}
                defaultExpanded={UNPAID_STATUSES.has(invoice.displayStatus)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pb-8 text-center">
          <p className="text-xs leading-relaxed text-zinc-400">
            {bizName}
            {bizEmail && (
              <>
                {' · '}
                <a href={`mailto:${bizEmail}`} className="underline underline-offset-2 hover:text-zinc-600 transition-colors">
                  {bizEmail}
                </a>
              </>
            )}
            {bizPhone && <> · {bizPhone}</>}
          </p>
        </footer>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────── */

function FilterTab({
  label,
  count,
  active,
  onSelect,
}: {
  label: string
  count: number
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-white text-zinc-900 shadow-sm'
          : 'text-zinc-500 hover:text-zinc-700'
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
            active ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-300/60 text-zinc-500'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function StatPill({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        highlight ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-100 bg-white'
      }`}
    >
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
  const messages: Record<Filter, { title: string; sub: string }> = {
    all: { title: 'No invoices yet', sub: 'Invoices will appear here once issued.' },
    unpaid: { title: 'Nothing outstanding', sub: "You're all caught up." },
    paid: { title: 'No paid invoices', sub: 'Paid invoices will show up here.' },
  }
  const { title, sub } = messages[filter]

  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
        <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-zinc-700">{title}</p>
      <p className="mt-1 text-xs text-zinc-400">{sub}</p>
    </div>
  )
}
