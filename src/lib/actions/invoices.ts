'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { InvoiceStatus, PaymentStructure } from '@prisma/client'

type LineItem = {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

type PhaseInput = {
  name: string
  amount: number
  dueDate: string
  sortOrder: number
}

export async function createInvoiceAction(data: {
  clientId: string
  title?: string
  issueDate: string
  dueDate: string
  items: LineItem[]
  tax: number
  discount: number
  notes?: string
  status: 'DRAFT' | 'SENT'
  paymentStructure?: 'FULL' | 'PARTIAL' | 'SCHEDULED'
  phases?: PhaseInput[]
}) {
  const userId = await getCurrentUserId()

  const count = await prisma.invoice.count({ where: { userId } })
  const number = `INV-${String(count + 1).padStart(4, '0')}`

  const subtotal = data.items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal - data.discount) * (data.tax / 100)
  const total = subtotal - data.discount + taxAmount

  const structure = (data.paymentStructure ?? 'FULL') as PaymentStructure

  const invoice = await prisma.invoice.create({
    data: {
      userId,
      clientId: data.clientId,
      number,
      title: data.title || null,
      status: data.status as InvoiceStatus,
      paymentStructure: structure,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      subtotal,
      discount: data.discount,
      tax: data.tax,
      total,
      notes: data.notes || null,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
      ...(structure === 'SCHEDULED' && data.phases?.length ? {
        phases: {
          create: data.phases.map((p) => ({
            name: p.name,
            amount: p.amount,
            dueDate: new Date(p.dueDate),
            sortOrder: p.sortOrder,
          })),
        },
      } : {}),
    },
  })

  revalidatePath('/invoices')
  revalidatePath(`/clients/${data.clientId}`)
  revalidatePath('/dashboard')
  redirect(`/invoices/${invoice.id}`)
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: InvoiceStatus
) {
  const userId = await getCurrentUserId()
  await prisma.invoice.update({
    where: { id: invoiceId, userId },
    data: { status },
  })
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}

export async function updateInvoiceAction(invoiceId: string, data: {
  clientId: string
  title?: string
  issueDate: string
  dueDate: string
  items: { description: string; quantity: number; unitPrice: number; total: number }[]
  tax: number
  discount: number
  notes?: string
  status: 'DRAFT' | 'SENT'
  paymentStructure?: 'FULL' | 'PARTIAL' | 'SCHEDULED'
  phases?: PhaseInput[]
}) {
  const userId = await getCurrentUserId()
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } })
  if (!invoice) throw new Error('Invoice not found')

  const subtotal = data.items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal - data.discount) * (data.tax / 100)
  const total = subtotal - data.discount + taxAmount

  const structure = (data.paymentStructure ?? 'FULL') as PaymentStructure

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      clientId: data.clientId,
      title: data.title || null,
      status: data.status as InvoiceStatus,
      paymentStructure: structure,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      subtotal,
      discount: data.discount,
      tax: data.tax,
      total,
      notes: data.notes || null,
      items: {
        deleteMany: {},
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
      phases: {
        deleteMany: {},
        ...(structure === 'SCHEDULED' && data.phases?.length ? {
          create: data.phases.map((p) => ({
            name: p.name,
            amount: p.amount,
            dueDate: new Date(p.dueDate),
            sortOrder: p.sortOrder,
          })),
        } : {}),
      },
    },
  })

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  redirect(`/invoices/${invoiceId}`)
}

export async function deleteInvoiceAction(invoiceId: string) {
  const userId = await getCurrentUserId()
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } })
  if (!invoice) throw new Error('Invoice not found')
  await prisma.invoice.delete({ where: { id: invoiceId } })
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}

export async function markPhasePaidAction(phaseId: string) {
  const userId = await getCurrentUserId()

  const phase = await prisma.invoicePhase.findFirst({
    where: { id: phaseId, invoice: { userId } },
  })
  if (!phase) throw new Error('Phase not found')

  await prisma.invoicePhase.update({
    where: { id: phaseId },
    data: { status: 'PAID', paidDate: new Date() },
  })

  // Create a payment record so payment history stays consistent
  await prisma.payment.create({
    data: {
      invoiceId: phase.invoiceId,
      amount: phase.amount,
      date: new Date(),
      notes: `Phase: ${phase.name}`,
    },
  })

  // Recompute invoice status from all phases
  const allPhases = await prisma.invoicePhase.findMany({
    where: { invoiceId: phase.invoiceId },
  })

  const now = new Date()
  const paidCount = allPhases.filter(p => p.status === 'PAID').length
  const unpaidCount = allPhases.filter(p => p.status === 'UNPAID').length
  const hasOverdueUnpaid = allPhases.some(p => p.status === 'UNPAID' && new Date(p.dueDate) < now)

  let newStatus: InvoiceStatus
  if (unpaidCount === 0) {
    newStatus = 'PAID'
  } else if (paidCount > 0) {
    newStatus = 'PARTIALLY_PAID'
  } else if (hasOverdueUnpaid) {
    newStatus = 'OVERDUE'
  } else {
    newStatus = 'SENT'
  }

  await prisma.invoice.update({
    where: { id: phase.invoiceId },
    data: { status: newStatus },
  })

  revalidatePath(`/invoices/${phase.invoiceId}`)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}

export async function recordPaymentAction(
  invoiceId: string,
  data: {
    amount: number
    date: string
    method?: string
    notes?: string
  }
) {
  const userId = await getCurrentUserId()

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { payments: true },
  })
  if (!invoice) throw new Error('Invoice not found')

  await prisma.payment.create({
    data: {
      invoiceId,
      amount: data.amount,
      date: new Date(data.date),
      method: data.method || null,
      notes: data.notes || null,
    },
  })

  const totalPaid =
    invoice.payments.reduce((sum, p) => sum + p.amount, 0) + data.amount

  if (totalPaid >= invoice.total) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' },
    })
  }

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}
