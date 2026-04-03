import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import ClientsPageClient from '@/components/clients/ClientsPageClient'

export default async function ClientsPage() {
  const userId = await getCurrentUserId()

  const clients = await prisma.client.findMany({
    where: { userId },
    include: {
      invoices: { select: { total: true, status: true, issueDate: true } },
      paymentClaims: { where: { status: 'PENDING' }, select: { id: true } },
      portalMessages: { where: { fromClient: true, read: false }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = clients.map((c) => {
    const totalInvoiced = c.invoices.reduce((sum, inv) => sum + inv.total, 0)
    const outstanding = c.invoices
      .filter((inv) => inv.status === 'SENT' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.total, 0)
    const dates = c.invoices.map((inv) => new Date(inv.issueDate))
    const lastInvoiceDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null

    return {
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      totalInvoiced,
      outstanding,
      lastInvoiceDate,
      portalLastSeen: c.portalLastSeen,
      pendingClaims: c.paymentClaims.length,
      unreadMessages: c.portalMessages.length,
    }
  })

  return (
    <div className="p-6 md:p-8">
      <ClientsPageClient clients={rows} />
    </div>
  )
}
