'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import { deleteInvoiceAction } from '@/lib/actions/invoices'

interface InvoiceRowProps {
  invoice: {
    id: string
    number: string
    title: string | null
    status: string
    total: number
    dueDate: Date
    client: { name: string }
  }
  formattedTotal: string
  formattedDue: string
}

export default function InvoiceRow({ invoice, formattedTotal, formattedDue }: InvoiceRowProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleRowClick() {
    router.push(`/invoices/${invoice.id}`)
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    router.push(`/invoices/${invoice.id}/edit`)
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirming(true)
  }

  function handleConfirmDelete(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      await deleteInvoiceAction(invoice.id)
      setConfirming(false)
    })
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirming(false)
  }

  return (
    <tr
      onClick={handleRowClick}
      className="hover:bg-slate-50 transition-colors cursor-pointer group"
    >
      <td className="px-6 py-4">
        <p className="font-medium text-slate-900">{invoice.number}</p>
        {invoice.title && <p className="text-xs text-slate-400 mt-0.5">{invoice.title}</p>}
      </td>
      <td className="px-6 py-4 text-slate-600">{invoice.client.name}</td>
      <td className="px-6 py-4"><StatusBadge status={invoice.status as never} /></td>
      <td className="px-6 py-4 text-right font-medium text-slate-900">{formattedTotal}</td>
      <td className="px-6 py-4 text-right text-slate-400 text-xs">{formattedDue}</td>
      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirming ? (
            <>
              <span className="text-xs text-slate-500 mr-1">Delete?</span>
              <button
                onClick={handleConfirmDelete}
                disabled={pending}
                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {pending ? 'Deleting…' : 'Yes'}
              </button>
              <button
                onClick={handleCancelDelete}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                No
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-md px-2.5 py-1 hover:bg-white transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                className="text-xs font-medium text-red-500 hover:text-red-700 border border-red-100 rounded-md px-2.5 py-1 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
