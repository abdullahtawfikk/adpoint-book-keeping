import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const { invoiceId } = await req.json() as { invoiceId: string }

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    select: { id: true, userId: true, name: true },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clientId: client.id },
    select: { id: true, number: true, clientApproved: true },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.clientApproved) return NextResponse.json({ ok: true })

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { clientApproved: true, clientApprovedAt: new Date() },
  })

  await prisma.notification.create({
    data: {
      userId: client.userId,
      type: 'approval',
      message: `${client.name} approved invoice ${invoice.number}`,
      invoiceId: invoice.id,
    },
  })

  return NextResponse.json({ ok: true })
}
