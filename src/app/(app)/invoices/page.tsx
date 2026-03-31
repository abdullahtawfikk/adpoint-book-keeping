import Link from 'next/link'
import { Suspense } from 'react'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatEGP, formatDate } from '@/lib/format'
import InvoiceFilters from '@/components/invoices/InvoiceFilters'
import InvoiceRow from '@/components/invoices/InvoiceRow'
import { InvoiceStatus } from '@prisma/client'
export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const userId = await getCurrentUserId()

  const where: { userId: string; status?: InvoiceStatus } = { userId }
  if (status && ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
    where.status = status as InvoiceStatus
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">{invoices.length} {status ? status.toLowerCase() : 'total'}</p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <Suspense>
          <InvoiceFilters />
        </Suspense>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-slate-400 text-sm">
              {status ? `No ${status.toLowerCase()} invoices.` : 'No invoices yet.'}
            </p>
            <Link href="/invoices/new" className="mt-3 inline-block text-sm font-medium text-slate-900 hover:underline">
              Create your first invoice →
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Invoice</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Client</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Due Date</th>
                    <th className="px-6 py-3 w-36" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <InvoiceRow
                      key={inv.id}
                      invoice={inv}
                      formattedTotal={formatEGP(inv.total)}
                      formattedDue={formatDate(inv.dueDate)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-slate-100">
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{inv.number}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{inv.client.name}</p>
                    <div className="mt-1"><StatusBadge status={inv.status} /></div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{formatEGP(inv.total)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Due {formatDate(inv.dueDate)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
