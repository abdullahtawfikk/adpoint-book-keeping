import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getInvoiceDisplayStatus } from '@/lib/invoice-status'
import PortalView from './PortalView'
import type { Invoice, Phase, PortalProposal } from './PortalView'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    include: {
      proposals: {
        where: { status: { not: 'DRAFT' } },
        orderBy: { createdAt: 'desc' },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        include: {
          phases: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, name: true, amount: true, dueDate: true, status: true, workStatus: true },
          },
          deliverables: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, description: true, fileUrl: true, fileType: true },
          },
        },
      },
    },
  })

  if (!client) notFound()

  const settings = await prisma.businessSettings
    .findUnique({
      where: { userId: client.userId },
      select: { businessName: true, logoUrl: true, email: true, phone: true },
    })
    .catch(() => null)

  const bizName = settings?.businessName ?? 'My Business'

  // Serialize dates → strings so we can pass to a Client Component
  const invoices: Invoice[] = client.invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    title: inv.title,
    total: inv.total,
    dueDate: inv.dueDate.toISOString(),
    displayStatus: getInvoiceDisplayStatus(inv) as Invoice['displayStatus'],
    clientApproved: inv.clientApproved,
    phases: inv.phases.map((p) => ({
      id: p.id,
      name: p.name,
      amount: p.amount,
      dueDate: p.dueDate.toISOString(),
      status: p.status,
      workStatus: p.workStatus as Phase['workStatus'],
    })),
    deliverables: inv.deliverables.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
    })),
  }))

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = invoices
    .filter((inv) => inv.displayStatus === 'PAID')
    .reduce((sum, inv) => sum + inv.total, 0)
  const outstanding = invoices
    .filter((inv) => !['PAID', 'CANCELLED', 'DRAFT'].includes(inv.displayStatus))
    .reduce((sum, inv) => {
      if (inv.phases.length > 0) {
        return sum + inv.phases
          .filter((p) => p.status === 'UNPAID')
          .reduce((t, p) => t + p.amount, 0)
      }
      return sum + inv.total
    }, 0)

  const proposals: PortalProposal[] = client.proposals.map(p => ({
    id:          p.id,
    title:       p.title,
    description: p.description,
    items:       p.items as unknown as PortalProposal['items'],
    total:       p.total,
    status:      p.status as PortalProposal['status'],
    clientNote:  p.clientNote,
    validUntil:  p.validUntil?.toISOString() ?? null,
    createdAt:   p.createdAt.toISOString(),
  }))

  return (
    <PortalView
      clientName={client.name}
      clientCompany={client.company}
      bizName={bizName}
      bizEmail={settings?.email ?? null}
      bizPhone={settings?.phone ?? null}
      bizLogoUrl={settings?.logoUrl ?? null}
      portalToken={token}
      invoices={invoices}
      proposals={proposals}
      totalInvoiced={totalInvoiced}
      totalPaid={totalPaid}
      outstanding={outstanding}
    />
  )
}
