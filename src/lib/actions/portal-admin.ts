'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { markPhasePaidAction, recordPaymentAction } from '@/lib/actions/invoices'

async function getAuthUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  return user.id
}

/* ── Claims ───────────────────────────────────────────────── */

export async function getPortalClaimsAction() {
  const userId = await getAuthUserId()

  const claims = await prisma.portalPaymentClaim.findMany({
    where: { client: { userId } },
    orderBy: { createdAt: 'desc' },
    include: {
      client:  { select: { id: true, name: true, company: true } },
      invoice: { select: { id: true, number: true, title: true } },
      phase:   { select: { id: true, name: true } },
    },
  })

  return claims
}

export async function confirmClaimAction(claimId: string, action: 'CONFIRMED' | 'REJECTED') {
  const userId = await getAuthUserId()

  const claim = await prisma.portalPaymentClaim.findFirst({
    where: { id: claimId, client: { userId } },
    include: { invoice: true, phase: true },
  })
  if (!claim) throw new Error('Claim not found')

  await prisma.portalPaymentClaim.update({
    where: { id: claimId },
    data: { status: action },
  })

  // Auto-mark as paid when confirmed
  if (action === 'CONFIRMED') {
    if (claim.phaseId) {
      await markPhasePaidAction(claim.phaseId)
    } else {
      await recordPaymentAction({
        invoiceId: claim.invoiceId,
        amount:    claim.amount,
        date:      new Date().toISOString(),
        method:    'InstaPay',
        notes:     'Confirmed via client portal payment claim',
      })
    }
  }

  revalidatePath('/clients')
  revalidatePath(`/invoices/${claim.invoiceId}`)
}

/* ── Messages ─────────────────────────────────────────────── */

export async function getPortalMessagesAction(clientId: string) {
  const userId = await getAuthUserId()

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  })
  if (!client) throw new Error('Client not found')

  const messages = await prisma.portalMessage.findMany({
    where: { clientId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, content: true, fromClient: true, invoiceId: true, read: true, createdAt: true },
  })

  // Mark unread client messages as read
  await prisma.portalMessage.updateMany({
    where: { clientId, fromClient: true, read: false },
    data: { read: true },
  })

  revalidatePath('/clients')
  return messages
}

export async function replyToClientAction(clientId: string, content: string, invoiceId?: string) {
  const userId = await getAuthUserId()

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  })
  if (!client) throw new Error('Client not found')

  const message = await prisma.portalMessage.create({
    data: {
      clientId,
      invoiceId: invoiceId ?? null,
      content:   content.trim(),
      fromClient: false,
      read:       true,
    },
    select: { id: true, content: true, fromClient: true, createdAt: true },
  })

  revalidatePath('/clients')
  return message
}

/* ── Portal activity summary ──────────────────────────────── */

export async function getPortalActivityAction() {
  const userId = await getAuthUserId()

  const [pendingClaims, unreadMessages] = await Promise.all([
    prisma.portalPaymentClaim.findMany({
      where: { client: { userId }, status: 'PENDING' },
      include: {
        client:  { select: { id: true, name: true } },
        invoice: { select: { id: true, number: true } },
        phase:   { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.portalMessage.findMany({
      where: { client: { userId }, fromClient: true, read: false },
      include: {
        client:  { select: { id: true, name: true } },
        invoice: { select: { id: true, number: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { pendingClaims, unreadMessages }
}

/* ── Per-client portal stats (for clients list) ──────────── */

export async function getClientsPortalStatsAction() {
  const userId = await getAuthUserId()

  const clients = await prisma.client.findMany({
    where: { userId },
    select: {
      id:            true,
      portalLastSeen: true,
      paymentClaims: {
        where:  { status: 'PENDING' },
        select: { id: true },
      },
      portalMessages: {
        where:  { fromClient: true, read: false },
        select: { id: true },
      },
    },
  })

  return clients.map(c => ({
    id:            c.id,
    portalLastSeen: c.portalLastSeen,
    pendingClaims: c.paymentClaims.length,
    unreadMessages: c.portalMessages.length,
  }))
}
