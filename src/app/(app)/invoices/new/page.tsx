import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const { clientId } = await searchParams
  const userId = await getCurrentUserId()

  const clients = await prisma.client.findMany({
    where: { userId },
    select: { id: true, name: true, company: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/invoices" className="hover:text-slate-700">Invoices</Link>
        <span>/</span>
        <span className="text-slate-700">New Invoice</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Create Invoice</h1>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-12 text-center">
          <p className="text-slate-500 text-sm">You need to add a client before creating an invoice.</p>
          <Link
            href="/clients"
            className="mt-3 inline-block text-sm font-medium text-slate-900 hover:underline"
          >
            Add a client →
          </Link>
        </div>
      ) : (
        <InvoiceForm clients={clients} defaultClientId={clientId} />
      )}
    </div>
  )
}
