import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const { invoiceId, note } = await req.json() as { invoiceId: string; note: string }

  if (!note?.trim()) {
    return NextResponse.json({ error: 'Note is required' }, { status: 400 })
  }

  const client = await prisma.client.findUnique({
    where:  { portalToken: token },
    select: { id: true, userId: true, name: true },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const invoice = await prisma.invoice.findFirst({
    where:  { id: invoiceId, clientId: client.id },
    select: { id: true, number: true },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const dispute = await prisma.invoiceDispute.create({
    data: { invoiceId, clientId: client.id, note: note.trim() },
  })

  await prisma.notification.create({
    data: {
      userId:    client.userId,
      type:      'dispute',
      message:   `${client.name} raised a dispute on invoice ${invoice.number}`,
      invoiceId: invoice.id,
    },
  })

  return NextResponse.json(dispute)
}
