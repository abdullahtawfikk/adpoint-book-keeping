import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const { searchParams } = new URL(req.url)
  const invoiceId = searchParams.get('invoiceId')

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    select: { id: true },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const general = searchParams.get('general')

  const messages = await prisma.portalMessage.findMany({
    where: {
      clientId:  client.id,
      ...(general ? { invoiceId: null } : invoiceId ? { invoiceId } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, content: true, fromClient: true, createdAt: true },
  })

  return NextResponse.json(messages)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const { content, invoiceId } = await req.json() as { content: string; invoiceId?: string }

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    select: { id: true, userId: true, name: true },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify invoice belongs to client when provided
  if (invoiceId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clientId: client.id },
      select: { id: true, number: true },
    })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    await prisma.notification.create({
      data: {
        userId:    client.userId,
        type:      'message',
        message:   `${client.name} sent a message on invoice ${invoice.number}`,
        invoiceId: invoice.id,
      },
    })
  } else {
    await prisma.notification.create({
      data: {
        userId:  client.userId,
        type:    'message',
        message: `${client.name} sent you a message`,
      },
    })
  }

  const message = await prisma.portalMessage.create({
    data: {
      clientId:   client.id,
      invoiceId:  invoiceId ?? null,
      content:    content.trim(),
      fromClient: true,
    },
    select: { id: true, content: true, fromClient: true, createdAt: true },
  })

  return NextResponse.json(message)
}
