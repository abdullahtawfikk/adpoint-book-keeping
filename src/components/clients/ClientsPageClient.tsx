'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import SlideOver from '@/components/ui/SlideOver'
import ClientForm from '@/components/clients/ClientForm'
import { formatEGP, formatDate } from '@/lib/format'

interface ClientRow {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  totalInvoiced: number
  outstanding: number
  lastInvoiceDate: Date | null
}

export default function ClientsPageClient({ clients }: { clients: ClientRow[] }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    )
  }, [clients, search])

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">{clients.length} total</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-slate-400 text-sm">
              {search ? 'No clients match your search.' : 'No clients yet.'}
            </p>
            {!search && (
              <button
                onClick={() => setOpen(true)}
                className="mt-3 text-sm font-medium text-slate-900 hover:underline"
              >
                Add your first client →
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Client</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Total Invoiced</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Outstanding</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Last Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/clients/${client.id}`} className="block">
                          <p className="font-medium text-slate-900">{client.name}</p>
                          {client.company && <p className="text-xs text-slate-400 mt-0.5">{client.company}</p>}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">{formatEGP(client.totalInvoiced)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={client.outstanding > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>
                          {formatEGP(client.outstanding)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 text-xs">
                        {client.lastInvoiceDate ? formatDate(client.lastInvoiceDate) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{client.name}</p>
                    {client.company && <p className="text-xs text-slate-400 mt-0.5">{client.company}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-700">{formatEGP(client.totalInvoiced)}</p>
                    {client.outstanding > 0 && (
                      <p className="text-xs text-red-500 mt-0.5">{formatEGP(client.outstanding)} due</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Slide-over */}
      <SlideOver open={open} onClose={() => setOpen(false)} title="Add Client">
        <ClientForm onSuccess={() => setOpen(false)} />
      </SlideOver>
    </>
  )
}
