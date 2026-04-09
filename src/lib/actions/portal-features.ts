'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/* ── Auth helper ──────────────────────────────────────────── */

async function getAuthUserId() {
  return getCurrentUserId()
}

/* ── Feature 3: Work Status ──────────────────────────────── */

export async function updatePhaseWorkStatusAction(
  phaseId: string,
  workStatus: 'PENDING' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DELIVERED',
) {
  const userId = await getAuthUserId()

  const phase = await prisma.invoicePhase.findFirst({
    where: { id: phaseId, invoice: { userId } },
    select: { id: true, invoiceId: true },
  })
  if (!phase) throw new Error('Phase not found')

  await prisma.invoicePhase.update({
    where: { id: phaseId },
    data:  { workStatus },
  })

  // Notify client if work is delivered
  if (workStatus === 'DELIVERED') {
    const inv = await prisma.invoice.findUnique({
      where:  { id: phase.invoiceId },
      select: { client: { select: { id: true, portalToken: true } } },
    })
    if (inv?.client) {
      await prisma.notification.create({
        data: {
          userId,
          type:      'delivery',
          message:   `Work delivered on invoice phase`,
          invoiceId: phase.invoiceId,
        },
      })
    }
  }

  revalidatePath(`/invoices/${phase.invoiceId}`)
}

/* ── Feature 2: Deliverables ─────────────────────────────── */

export async function uploadDeliverableAction(formData: FormData) {
  const userId = await getAuthUserId()

  const invoiceId = formData.get('invoiceId') as string
  const phaseId   = formData.get('phaseId') as string | null
  const name      = formData.get('name') as string
  const description = formData.get('description') as string | null
  const file      = formData.get('file') as File | null

  const invoice = await prisma.invoice.findFirst({
    where:  { id: invoiceId, userId },
    select: { id: true, client: { select: { name: true } } },
  })
  if (!invoice) throw new Error('Invoice not found')

  let fileUrl = formData.get('fileUrl') as string | null
  let fileType: string | null = null

  if (file && file.size > 0) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
      )
      const ext      = file.name.split('.').pop()
      const path     = `deliverables/${invoiceId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('receipts')
        .upload(path, file, { upsert: false })
      if (!error) {
        const { data } = supabase.storage.from('receipts').getPublicUrl(path)
        fileUrl  = data.publicUrl
        fileType = file.type
      }
    }
  }

  if (!fileUrl) throw new Error('No file or URL provided')

  const deliverable = await prisma.deliverable.create({
    data: {
      invoiceId,
      phaseId:     phaseId || null,
      name:        name.trim(),
      description: description?.trim() || null,
      fileUrl,
      fileType,
    },
  })

  revalidatePath(`/invoices/${invoiceId}`)
  return deliverable
}

export async function deleteDeliverableAction(deliverableId: string) {
  const userId = await getAuthUserId()

  const d = await prisma.deliverable.findFirst({
    where: { id: deliverableId, invoice: { userId } },
    select: { id: true, invoiceId: true },
  })
  if (!d) throw new Error('Not found')

  await prisma.deliverable.delete({ where: { id: deliverableId } })
  revalidatePath(`/invoices/${d.invoiceId}`)
}

/* ── Feature 4: Disputes (admin side) ───────────────────── */

export async function resolveDisputeAction(disputeId: string) {
  const userId = await getAuthUserId()

  const dispute = await prisma.invoiceDispute.findFirst({
    where:  { id: disputeId, invoice: { userId } },
    select: { id: true, invoiceId: true },
  })
  if (!dispute) throw new Error('Dispute not found')

  await prisma.invoiceDispute.update({
    where: { id: disputeId },
    data:  { resolved: true },
  })

  revalidatePath(`/invoices/${dispute.invoiceId}`)
  revalidatePath('/clients')
}

/* ── Feature 5: Proposals ────────────────────────────────── */

export interface ProposalItemInput {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export async function createProposalAction(data: {
  clientId:    string
  title:       string
  description: string
  items:       ProposalItemInput[]
  total:       number
  validUntil?: string
  send:        boolean
}) {
  const userId = await getAuthUserId()

  const client = await prisma.client.findFirst({
    where:  { id: data.clientId, userId },
    select: { id: true },
  })
  if (!client) throw new Error('Client not found')

  const proposal = await prisma.proposal.create({
    data: {
      userId,
      clientId:    data.clientId,
      title:       data.title,
      description: data.description || null,
      items:       data.items as object[],
      total:       data.total,
      status:      data.send ? 'SENT' : 'DRAFT',
      validUntil:  data.validUntil ? new Date(data.validUntil) : null,
    },
  })

  revalidatePath('/clients')
  return proposal
}

export async function updateProposalStatusAction(
  proposalId: string,
  status: 'SENT' | 'REJECTED',
) {
  const userId = await getAuthUserId()

  const proposal = await prisma.proposal.findFirst({
    where:  { id: proposalId, userId },
    select: { id: true, clientId: true },
  })
  if (!proposal) throw new Error('Proposal not found')

  await prisma.proposal.update({
    where: { id: proposalId },
    data:  { status },
  })

  revalidatePath(`/clients/${proposal.clientId}`)
}

export async function deleteProposalAction(proposalId: string) {
  const userId = await getAuthUserId()

  const proposal = await prisma.proposal.findFirst({
    where:  { id: proposalId, userId },
    select: { id: true, clientId: true },
  })
  if (!proposal) throw new Error('Not found')

  await prisma.proposal.delete({ where: { id: proposalId } })
  revalidatePath(`/clients/${proposal.clientId}`)
}

/* ── Feature 7: Retainer ─────────────────────────────────── */

export async function addRetainerEntryAction(data: {
  invoiceId:   string
  description: string
  hours?:      number
  amount:      number
  date:        string
}) {
  const userId = await getAuthUserId()

  const invoice = await prisma.invoice.findFirst({
    where:  { id: data.invoiceId, userId },
    select: { id: true },
  })
  if (!invoice) throw new Error('Invoice not found')

  const entry = await prisma.retainerEntry.create({
    data: {
      invoiceId:   data.invoiceId,
      description: data.description.trim(),
      hours:       data.hours ?? null,
      amount:      data.amount,
      date:        new Date(data.date),
    },
  })

  revalidatePath(`/invoices/${data.invoiceId}`)
  return entry
}

export async function deleteRetainerEntryAction(entryId: string) {
  const userId = await getAuthUserId()

  const entry = await prisma.retainerEntry.findFirst({
    where:  { id: entryId, invoice: { userId } },
    select: { id: true, invoiceId: true },
  })
  if (!entry) throw new Error('Not found')

  await prisma.retainerEntry.delete({ where: { id: entryId } })
  revalidatePath(`/invoices/${entry.invoiceId}`)
}

export async function toggleRetainerAction(invoiceId: string, isRetainer: boolean, retainerHours?: number) {
  const userId = await getAuthUserId()

  const invoice = await prisma.invoice.findFirst({
    where:  { id: invoiceId, userId },
    select: { id: true },
  })
  if (!invoice) throw new Error('Not found')

  await prisma.invoice.update({
    where: { id: invoiceId },
    data:  { isRetainer, retainerHours: retainerHours ?? null },
  })

  revalidatePath(`/invoices/${invoiceId}`)
}
