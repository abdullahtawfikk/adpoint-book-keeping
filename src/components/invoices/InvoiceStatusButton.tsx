'use client'

import { useTransition } from 'react'
import { updateInvoiceStatusAction } from '@/lib/actions/invoices'
import { InvoiceStatus } from '@prisma/client'

const transitions: Record<string, { label: string; next: InvoiceStatus }[]> = {
  DRAFT: [{ label: 'Mark as Sent', next: 'SENT' }],
  SENT: [
    { label: 'Mark as Paid', next: 'PAID' },
    { label: 'Mark as Overdue', next: 'OVERDUE' },
  ],
  OVERDUE: [
    { label: 'Mark as Paid', next: 'PAID' },
    { label: 'Mark as Sent', next: 'SENT' },
  ],
  PAID: [],
  CANCELLED: [],
}

export default function InvoiceStatusButton({
  invoiceId,
  status,
}: {
  invoiceId: string
  status: string
}) {
  const [isPending, startTransition] = useTransition()
  const actions = transitions[status] ?? []
  if (actions.length === 0) return null

  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map((action) => (
        <button
          key={action.next}
          disabled={isPending}
          onClick={() =>
            startTransition(() => updateInvoiceStatusAction(invoiceId, action.next))
          }
          className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Updating...' : action.label}
        </button>
      ))}
    </div>
  )
}
