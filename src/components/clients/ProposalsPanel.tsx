'use client'

import { useState, useTransition } from 'react'
import { formatEGP, formatDate } from '@/lib/format'
import {
  createProposalAction,
  updateProposalStatusAction,
  deleteProposalAction,
} from '@/lib/actions/portal-features'

interface ProposalItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface SerializedProposal {
  id: string
  title: string
  description: string | null
  items: ProposalItem[]
  total: number
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'CHANGES_REQUESTED' | 'REJECTED'
  clientNote: string | null
  validUntil: string | null
  createdAt: string
}

interface ProposalsPanelProps {
  clientId: string
  initialProposals: SerializedProposal[]
}

const STATUS_COLORS: Record<SerializedProposal['status'], string> = {
  DRAFT:             'bg-zinc-100 text-zinc-600',
  SENT:              'bg-blue-100 text-blue-700',
  ACCEPTED:          'bg-emerald-100 text-emerald-700',
  CHANGES_REQUESTED: 'bg-amber-100 text-amber-700',
  REJECTED:          'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<SerializedProposal['status'], string> = {
  DRAFT:             'Draft',
  SENT:              'Sent',
  ACCEPTED:          'Accepted',
  CHANGES_REQUESTED: 'Changes Requested',
  REJECTED:          'Rejected',
}

const EMPTY_ITEM: ProposalItem = { description: '', quantity: 1, unitPrice: 0, total: 0 }

export default function ProposalsPanel({ clientId, initialProposals }: ProposalsPanelProps) {
  const [proposals, setProposals]   = useState(initialProposals)
  const [showForm,  setShowForm]    = useState(false)
  const [expanded,  setExpanded]    = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [validUntil,  setValidUntil]  = useState('')
  const [items,       setItems]       = useState<ProposalItem[]>([{ ...EMPTY_ITEM }])

  const total = items.reduce((s, i) => s + i.total, 0)

  function updateItem(idx: number, field: keyof ProposalItem, value: string | number) {
    setItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        next[idx].total = next[idx].quantity * next[idx].unitPrice
      }
      return next
    })
  }

  function handleSubmit(send: boolean) {
    if (!title.trim() || items.some(i => !i.description.trim())) return
    startTransition(async () => {
      const p = await createProposalAction({ clientId, title, description, items, total, validUntil: validUntil || undefined, send })
      setProposals(prev => [{
        id: p.id, title: p.title, description: p.description,
        items: p.items as unknown as ProposalItem[], total: p.total,
        status: p.status as SerializedProposal['status'],
        clientNote: p.clientNote, validUntil: p.validUntil?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      }, ...prev])
      setShowForm(false)
      setTitle(''); setDescription(''); setValidUntil(''); setItems([{ ...EMPTY_ITEM }])
    })
  }

  function handleSend(proposalId: string) {
    startTransition(async () => {
      await updateProposalStatusAction(proposalId, 'SENT')
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'SENT' } : p))
    })
  }

  function handleDelete(proposalId: string) {
    startTransition(async () => {
      await deleteProposalAction(proposalId)
      setProposals(prev => prev.filter(p => p.id !== proposalId))
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="font-semibold text-slate-900">Proposals</h2>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Proposal
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border-b border-slate-100 px-6 py-5 space-y-4 bg-slate-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Website Redesign Proposal"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief overview…"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Valid Until</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-500">Line Items *</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                    placeholder="Description" className="col-span-5 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
                  <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                    placeholder="Qty" className="col-span-2 rounded-lg border border-slate-200 px-2 py-2 text-sm text-center focus:border-slate-400 focus:outline-none" />
                  <input type="number" min="0" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                    placeholder="Price" className="col-span-3 rounded-lg border border-slate-200 px-2 py-2 text-sm text-right focus:border-slate-400 focus:outline-none" />
                  <span className="col-span-1 text-right text-xs font-medium text-slate-600">{item.total.toLocaleString()}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                      className="col-span-1 text-slate-300 hover:text-red-500 transition-colors">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setItems(prev => [...prev, { ...EMPTY_ITEM }])}
              className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              + Add item
            </button>
            <div className="mt-3 flex justify-end">
              <span className="text-sm font-semibold text-slate-900">Total: {formatEGP(total)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="button" onClick={() => handleSubmit(false)} disabled={isPending || !title.trim()}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
              Save Draft
            </button>
            <button type="button" onClick={() => handleSubmit(true)} disabled={isPending || !title.trim()}
              className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
              {isPending ? 'Sending…' : 'Send to Client'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {proposals.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-slate-400">No proposals yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {proposals.map(p => (
            <div key={p.id}>
              <button type="button" onClick={() => setExpanded(e => e === p.id ? null : p.id)}
                className="flex w-full items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{p.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                    {(p.status === 'ACCEPTED' || p.status === 'CHANGES_REQUESTED') && (
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDate(p.createdAt)} · {formatEGP(p.total)}</p>
                </div>
                <svg className={`h-4 w-4 text-slate-400 transition-transform ${expanded === p.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expanded === p.id && (
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 space-y-3">
                  {p.description && <p className="text-sm text-slate-600">{p.description}</p>}

                  {/* Items */}
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {p.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 last:border-0">
                        <span className="text-sm text-slate-800 flex-1">{item.description}</span>
                        <span className="text-xs text-slate-400 mx-4">{item.quantity} × {formatEGP(item.unitPrice)}</span>
                        <span className="text-sm font-medium text-slate-900">{formatEGP(item.total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 bg-slate-50 border-t border-slate-100">
                      <span className="text-sm font-semibold text-slate-900">Total</span>
                      <span className="text-sm font-semibold text-slate-900">{formatEGP(p.total)}</span>
                    </div>
                  </div>

                  {/* Client note */}
                  {p.clientNote && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-1">Client Note</p>
                      <p className="text-sm text-amber-900">{p.clientNote}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {p.status === 'DRAFT' && (
                      <button type="button" onClick={() => handleSend(p.id)} disabled={isPending}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition-colors">
                        Send to Client
                      </button>
                    )}
                    <button type="button" onClick={() => handleDelete(p.id)} disabled={isPending}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
