import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatEGP, formatDate } from '@/lib/format'
import StatusBadge from '@/components/ui/StatusBadge'
import InvoiceStatusButton from '@/components/invoices/InvoiceStatusButton'
import RecordPaymentModal from '@/components/invoices/RecordPaymentModal'
import PhaseTimeline from '@/components/invoices/PhaseTimeline'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await getCurrentUserId()

  const [invoice, businessSettings] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        client: true,
        items: true,
        payments: { orderBy: { date: 'desc' } },
        phases: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.businessSettings.findUnique({
      where: { userId },
      select: { businessName: true, logoUrl: true, address: true, phone: true, email: true },
    }).catch(() => null),
  ])

  if (!invoice) notFound()

  const amountPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = invoice.total - amountPaid

  const bizName = businessSettings?.businessName || 'My Business'
  const initials = bizName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'B'

  const hasSchedule = invoice.paymentStructure === 'SCHEDULED' && invoice.phases.length > 0

  return (
    <div className="p-6 md:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/invoices" className="hover:text-slate-700">Invoices</Link>
        <span>/</span>
        <span className="text-slate-700">{invoice.number}</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={invoice.status} />
          <InvoiceStatusButton invoiceId={invoice.id} status={invoice.status} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && !hasSchedule && (
            <RecordPaymentModal
              invoiceId={invoice.id}
              invoiceTotal={invoice.total}
              amountPaid={amountPaid}
            />
          )}
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </a>
          {invoice.status === 'DRAFT' && (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Invoice document */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8 flex-wrap">
          <div>
            {businessSettings?.logoUrl ? (
              <Image src={businessSettings.logoUrl} alt={bizName} width={40} height={40} className="rounded-xl mb-4 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white text-sm font-bold">{initials}</span>
              </div>
            )}
            <p className="font-bold text-slate-900 text-lg">{bizName}</p>
            {businessSettings?.address && <p className="text-slate-500 text-sm">{businessSettings.address}</p>}
            {businessSettings?.email && <p className="text-slate-500 text-sm">{businessSettings.email}</p>}
            {businessSettings?.phone && <p className="text-slate-500 text-sm">{businessSettings.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">{invoice.number}</p>
            {invoice.title && <p className="text-slate-500 text-sm mt-1">{invoice.title}</p>}
            <div className="mt-3 text-sm text-slate-500 space-y-1">
              <div className="flex justify-end gap-4">
                <span>Issue Date</span>
                <span className="text-slate-900 font-medium">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span>Due Date</span>
                <span className="text-slate-900 font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill to */}
        <div className="mb-8">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Bill To</p>
          <p className="font-semibold text-slate-900">{invoice.client.name}</p>
          {invoice.client.company && <p className="text-slate-500 text-sm">{invoice.client.company}</p>}
          {invoice.client.email && <p className="text-slate-500 text-sm">{invoice.client.email}</p>}
          {invoice.client.phone && <p className="text-slate-500 text-sm">{invoice.client.phone}</p>}
          {invoice.client.address && <p className="text-slate-500 text-sm">{invoice.client.address}</p>}
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Description</th>
                <th className="text-center py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-20">Qty</th>
                <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-32">Unit Price</th>
                <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-slate-800">{item.description}</td>
                  <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-600">{formatEGP(item.unitPrice)}</td>
                  <td className="py-3 text-right font-medium text-slate-900">{formatEGP(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatEGP(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span className="text-red-600">− {formatEGP(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({invoice.tax}%)</span>
                <span>{formatEGP((invoice.subtotal - invoice.discount) * invoice.tax / 100)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>{formatEGP(invoice.total)}</span>
            </div>
            {!hasSchedule && amountPaid > 0 && (
              <>
                <div className="flex justify-between text-emerald-600">
                  <span>Amount Paid</span>
                  <span>− {formatEGP(amountPaid)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Balance Due</span>
                  <span>{formatEGP(remaining)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Notes</p>
            <p className="text-sm text-slate-600">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment schedule */}
      {hasSchedule && (
        <div className="mb-6">
          <PhaseTimeline
            invoiceId={invoice.id}
            invoiceTotal={invoice.total}
            phases={invoice.phases.map((p) => ({
              id: p.id,
              name: p.name,
              amount: p.amount,
              dueDate: p.dueDate,
              paidDate: p.paidDate,
              status: p.status,
              sortOrder: p.sortOrder,
            }))}
          />
        </div>
      )}

      {/* Payment history (for non-scheduled or if there are manual payments) */}
      {invoice.payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-900">Payment History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {invoice.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{formatEGP(payment.amount)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {payment.method ?? 'Payment'} · {formatDate(payment.date)}
                  </p>
                  {payment.notes && <p className="text-xs text-slate-400">{payment.notes}</p>}
                </div>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">Received</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
