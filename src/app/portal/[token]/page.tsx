import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { formatEGP, formatDate } from '@/lib/format'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:         { bg: 'bg-slate-100',   text: 'text-slate-600',   label: 'Draft' },
  SENT:          { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Sent' },
  PARTIALLY_PAID:{ bg: 'bg-purple-100',  text: 'text-purple-700',  label: 'Partial' },
  PAID:          { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Paid' },
  OVERDUE:       { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Overdue' },
  CANCELLED:     { bg: 'bg-slate-100',   text: 'text-slate-400',   label: 'Cancelled' },
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    include: {
      invoices: {
        orderBy: { createdAt: 'desc' },
        include: { phases: { select: { status: true, amount: true } } },
      },
    },
  })

  if (!client) notFound()

  const businessSettings = await prisma.businessSettings.findUnique({
    where: { userId: client.userId },
    select: { businessName: true, logoUrl: true, address: true, email: true, phone: true },
  }).catch(() => null)

  const bizName = businessSettings?.businessName || 'My Business'
  const initials = bizName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'B'

  const totalInvoiced = client.invoices.reduce((s, inv) => s + inv.total, 0)
  const totalPaid = client.invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((s, inv) => s + inv.total, 0)
  // For SCHEDULED invoices, outstanding = sum of unpaid phases; otherwise full invoice total
  const outstanding = client.invoices
    .filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'DRAFT')
    .reduce((s, inv) => {
      if (inv.phases.length > 0) {
        return s + inv.phases.filter(p => p.status === 'UNPAID').reduce((ps, p) => ps + p.amount, 0)
      }
      return s + inv.total
    }, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-4">
          {businessSettings?.logoUrl ? (
            <Image
              src={businessSettings.logoUrl}
              alt={bizName}
              width={40}
              height={40}
              className="rounded-xl object-contain flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900">{bizName}</p>
            {businessSettings?.email && (
              <p className="text-xs text-slate-500 mt-0.5">{businessSettings.email}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Client info + outstanding */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{client.name}</h1>
              {client.company && <p className="text-slate-500 text-sm mt-0.5">{client.company}</p>}
            </div>
            {outstanding > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">{formatEGP(outstanding)}</p>
              </div>
            )}
            {outstanding === 0 && totalInvoiced > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Balance</p>
                <p className="text-lg font-semibold text-emerald-600">All paid — thank you!</p>
              </div>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Total Invoiced</p>
              <p className="text-base font-semibold text-slate-900 mt-0.5">{formatEGP(totalInvoiced)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="text-base font-semibold text-emerald-600 mt-0.5">{formatEGP(totalPaid)}</p>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-900">Invoices</h2>
          </div>

          {client.invoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-400 text-sm">No invoices yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {client.invoices.map((inv) => {
                const st = STATUS_STYLES[inv.status] ?? STATUS_STYLES.DRAFT
                return (
                  <div key={inv.id} className="flex items-center justify-between gap-4 px-6 py-4 flex-wrap">
                    {/* Left: number + title + due */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{inv.number}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </div>
                      {inv.title && <p className="text-xs text-slate-500 mt-0.5">{inv.title}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">Due {formatDate(inv.dueDate)}</p>
                    </div>

                    {/* Right: amount + PDF */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{formatEGP(inv.total)}</p>
                      <a
                        href={`/api/portal/${token}/${inv.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-6">
          {bizName}
          {businessSettings?.email ? ` · ${businessSettings.email}` : ''}
          {businessSettings?.phone ? ` · ${businessSettings.phone}` : ''}
        </p>
      </div>
    </div>
  )
}
