'use client'

import { useState, useTransition } from 'react'
import { createInvoiceAction, updateInvoiceAction } from '@/lib/actions/invoices'
import { formatEGP } from '@/lib/format'

interface Client {
  id: string
  name: string
  company: string | null
}

interface LineItem {
  id: string
  description: string
  quantity: string
  unitPrice: string
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '' }
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function addDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

interface InitialData {
  invoiceId: string
  clientId: string
  title: string | null
  issueDate: string
  dueDate: string
  items: { description: string; quantity: number; unitPrice: number }[]
  tax: number
  discount: number
  notes: string | null
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
}

export default function InvoiceForm({
  clients,
  defaultClientId,
  defaultTaxRate,
  defaultPaymentTerms,
  initialData,
}: {
  clients: Client[]
  defaultClientId?: string
  defaultTaxRate?: number
  defaultPaymentTerms?: number
  initialData?: InitialData
}) {
  const isEdit = !!initialData
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [clientId, setClientId] = useState(initialData?.clientId ?? defaultClientId ?? '')
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [issueDate, setIssueDate] = useState(initialData?.issueDate ?? today())
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? addDays(defaultPaymentTerms ?? 14))
  const [items, setItems] = useState<LineItem[]>(
    initialData?.items.map((i) => ({
      id: crypto.randomUUID(),
      description: i.description,
      quantity: String(i.quantity),
      unitPrice: String(i.unitPrice),
    })) ?? [newItem()]
  )
  const [tax, setTax] = useState(initialData ? String(initialData.tax) : defaultTaxRate ? String(defaultTaxRate) : '')
  const [discount, setDiscount] = useState(initialData ? String(initialData.discount) : '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  // Calculated totals
  const subtotal = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0
    const p = parseFloat(item.unitPrice) || 0
    return sum + q * p
  }, 0)
  const discountAmt = parseFloat(discount) || 0
  const taxRate = parseFloat(tax) || 0
  const taxAmount = (subtotal - discountAmt) * (taxRate / 100)
  const total = subtotal - discountAmt + taxAmount

  function updateItem(id: string, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems((prev) => [...prev, newItem()])
  }

  function removeItem(id: string) {
    if (items.length === 1) return
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function handleSubmit(status: 'DRAFT' | 'SENT') {
    if (!clientId) { setError('Please select a client'); return }
    if (!dueDate) { setError('Due date is required'); return }
    const hasEmptyItem = items.some((i) => !i.description.trim() || !i.unitPrice)
    if (hasEmptyItem) { setError('All line items must have a description and price'); return }
    setError('')

    const lineItems = items.map((item) => {
      const q = parseFloat(item.quantity) || 1
      const p = parseFloat(item.unitPrice) || 0
      return { description: item.description, quantity: q, unitPrice: p, total: q * p }
    })

    startTransition(async () => {
      try {
        if (isEdit && initialData) {
          await updateInvoiceAction(initialData.invoiceId, {
            clientId, title: title || undefined, issueDate, dueDate,
            items: lineItems, tax: taxRate, discount: discountAmt,
            notes: notes || undefined, status,
          })
        } else {
          await createInvoiceAction({
            clientId, title: title || undefined, issueDate, dueDate,
            items: lineItems, tax: taxRate, discount: discountAmt,
            notes: notes || undefined, status,
          })
        }
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Client + title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-medium text-slate-900">Invoice Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` — ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Website Development — Phase 1"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-medium text-slate-900 mb-4">Line Items</h2>

        <div className="space-y-3">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-medium text-slate-500 uppercase tracking-wide px-1">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-3 text-right">Unit Price (EGP)</div>
            <div className="col-span-1" />
          </div>

          {items.map((item, idx) => {
            const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
            return (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 md:col-span-6">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder={`Item ${idx + 1} description`}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="col-span-7 md:col-span-3">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-1">
                  <span className="text-xs text-slate-400 hidden md:inline">{lineTotal > 0 ? formatEGP(lineTotal) : ''}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-slate-300 hover:text-red-400 disabled:opacity-0 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={addItem}
          className="mt-4 text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Line Item
        </button>
      </div>

      {/* Totals + notes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tax Rate (%)</label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount (EGP)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Payment terms, bank details, etc."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-900">{formatEGP(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="text-red-600">− {formatEGP(discountAmt)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax ({taxRate}%)</span>
                <span className="text-slate-900">{formatEGP(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-3 border-t border-slate-200">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">{formatEGP(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={() => handleSubmit('DRAFT')}
          disabled={isPending}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {isEdit ? 'Save as Draft' : 'Save as Draft'}
        </button>
        <button
          onClick={() => handleSubmit('SENT')}
          disabled={isPending}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save & Mark as Sent' : 'Create & Mark as Sent')}
        </button>
      </div>
    </div>
  )
}
