'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { InvoiceStatus } from '@prisma/client'

type LineItem = {
  description: string
  quantity: number
  unitPrice: number
  total: number
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
}) {
  const userId = await getCurrentUserId()

  const count = await prisma.invoice.count({ where: { userId } })
  const number = `INV-${String(count + 1).padStart(4, '0')}`

  const subtotal = data.items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal - data.discount) * (data.tax / 100)
  const total = subtotal - data.discount + taxAmount

  const invoice = await prisma.invoice.create({
    data: {
      userId,
      clientId: data.clientId,
      number,
      title: data.title || null,
      status: data.status as InvoiceStatus,
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
