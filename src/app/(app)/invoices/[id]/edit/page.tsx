import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await getCurrentUserId()

  const [invoice, clients] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId },
      include: { items: true, phases: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.client.findMany({
      where: { userId },
      select: { id: true, name: true, company: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!invoice) notFound()

  const initialData = {
    invoiceId: invoice.id,
    clientId: invoice.clientId,
    title: invoice.title,
    issueDate: invoice.issueDate.toISOString().split('T')[0],
    dueDate: invoice.dueDate.toISOString().split('T')[0],
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    tax: invoice.tax,
    discount: invoice.discount,
    notes: invoice.notes,
    status: invoice.status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID',
    paymentStructure: invoice.paymentStructure as 'FULL' | 'PARTIAL' | 'SCHEDULED',
    phases: invoice.phases.map((p, i) => ({
      name: p.name,
      amount: p.amount,
      dueDate: p.dueDate.toISOString().split('T')[0],
      sortOrder: i,
    })),
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/invoices" className="hover:text-slate-700">Invoices</Link>
        <span>/</span>
        <Link href={`/invoices/${invoice.id}`} className="hover:text-slate-700">{invoice.number}</Link>
        <span>/</span>
        <span className="text-slate-700">Edit</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Edit {invoice.number}</h1>
      </div>

      <InvoiceForm clients={clients} initialData={initialData} />
    </div>
  )
}
