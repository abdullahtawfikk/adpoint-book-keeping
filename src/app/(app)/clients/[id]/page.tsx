import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatEGP, formatDate } from '@/lib/format'
import StatusBadge from '@/components/ui/StatusBadge'
import ClientDetailActions from '@/components/clients/ClientDetailActions'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await getCurrentUserId()

  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: {
      invoices: {
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!client) notFound()

  const totalInvoiced = client.invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = client.invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.total, 0)
  const outstanding = totalInvoiced - totalPaid

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/clients" className="hover:text-slate-700">Clients</Link>
        <span>/</span>
        <span className="text-slate-700">{client.name}</span>
      </div>

      {/* Client card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{client.name}</h1>
            {client.company && <p className="text-slate-500 text-sm mt-0.5">{client.company}</p>}
            <div className="flex flex-wrap gap-4 mt-3">
              {client.email && (
                <a href={`mailto:${client.email}`} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {client.phone}
                </a>
              )}
              {client.address && (
                <span className="text-sm text-slate-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {client.address}
                </span>
              )}
            </div>
            {client.notes && (
              <p className="mt-3 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{client.notes}</p>
            )}
          </div>
          <ClientDetailActions client={client} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Invoiced</p>
          <p className="text-lg font-semibold text-slate-900">{formatEGP(totalInvoiced)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Paid</p>
          <p className="text-lg font-semibold text-emerald-600">{formatEGP(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Outstanding</p>
          <p className={`text-lg font-semibold ${outstanding > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {formatEGP(outstanding)}
          </p>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-900">Invoices</h2>
          <Link
            href={`/invoices/new?clientId=${client.id}`}
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </Link>
        </div>

        {client.invoices.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-400 text-sm">No invoices for this client yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {client.invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{inv.number}</p>
                  {inv.title && <p className="text-xs text-slate-400 mt-0.5">{inv.title}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">Due {formatDate(inv.dueDate)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={inv.status} />
                  <span className="text-sm font-medium text-slate-900">{formatEGP(inv.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
