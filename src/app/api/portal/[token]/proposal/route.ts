import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: list proposals for this client
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const client = await prisma.client.findUnique({
    where:  { portalToken: token },
    select: { id: true },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const proposals = await prisma.proposal.findMany({
    where:   { clientId: client.id, status: { not: 'DRAFT' } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(proposals)
}

// POST: client responds to a proposal (accept / request changes)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const { proposalId, action, note } = await req.json() as {
    proposalId: string
    action: 'ACCEPTED' | 'CHANGES_REQUESTED'
    note?: string
  }

  const client = await prisma.client.findUnique({
    where:  { portalToken: token },
    select: { id: true, userId: true, name: true },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const proposal = await prisma.proposal.findFirst({
    where:  { id: proposalId, clientId: client.id },
    select: { id: true, title: true },
  })
  if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data:  { status: action, clientNote: note?.trim() || null },
  })

  await prisma.notification.create({
    data: {
      userId:  client.userId,
      type:    'proposal',
      message: action === 'ACCEPTED'
        ? `${client.name} accepted proposal: ${proposal.title}`
        : `${client.name} requested changes on proposal: ${proposal.title}`,
    },
  })

  return NextResponse.json(updated)
}
