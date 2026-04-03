import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPaymobHmac } from '@/lib/paymob'
import { revalidatePath } from 'next/cache'
import { InvoiceStatus } from '@prisma/client'
import { getScheduledInvoiceStatus } from '@/lib/invoice-status'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hmac = searchParams.get('hmac') ?? ''
    const body = await request.json() as { type?: string; obj?: Record<string, unknown> }

    // Only process transaction events
    if (body.type !== 'TRANSACTION' || !body.obj) {
      return NextResponse.json({ received: true })
    }

    const obj = body.obj

    // Verify HMAC signature
    if (!verifyPaymobHmac(obj, hmac)) {
      console.warn('[paymob/webhook] HMAC verification failed')
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
    }

    // Only act on successful, non-pending transactions
    if (!obj.success || obj.pending) {
      return NextResponse.json({ received: true })
    }

    const order = obj.order as Record<string, unknown>
    const merchantOrderId = String(order?.merchant_order_id ?? '')
    const amountCents = Number(obj.amount_cents ?? 0)
    const amountEGP = amountCents / 100
    const paymobTxId = String(obj.id ?? '')

    // Prevent duplicate processing
    const alreadyRecorded = await prisma.payment.findFirst({
      where: { notes: { contains: `paymob:${paymobTxId}` } },
    })
    if (alreadyRecorded) return NextResponse.json({ received: true })

    if (merchantOrderId.startsWith('phase_')) {
      // ── Phase payment ─────────────────────────────────────────────────────
      const phaseId = merchantOrderId.replace('phase_', '')
      const phase = await prisma.invoicePhase.findFirst({
        where: { id: phaseId },
      })
      if (!phase) return NextResponse.json({ error: 'Phase not found' }, { status: 404 })

      // Mark phase paid
      await prisma.invoicePhase.update({
        where: { id: phaseId },
        data: { status: 'PAID', paidDate: new Date() },
      })

      // Record payment
      await prisma.payment.create({
        data: {
          invoiceId: phase.invoiceId,
          amount: amountEGP,
          date: new Date(),
          method: 'Paymob',
          notes: `Phase: ${phase.name} · paymob:${paymobTxId}`,
        },
      })

      // Recompute invoice status
      const allPhases = await prisma.invoicePhase.findMany({
        where: { invoiceId: phase.invoiceId },
      })
      const newStatus: InvoiceStatus = getScheduledInvoiceStatus(allPhases)

      const invoice = await prisma.invoice.update({
        where: { id: phase.invoiceId },
        data: { status: newStatus },
        include: { client: { select: { name: true } } },
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: invoice.userId,
          type: 'payment',
          message: `${invoice.client.name} paid ${formatEGP(amountEGP)} — ${invoice.number} (${phase.name})`,
          invoiceId: invoice.id,
        },
      })

      revalidatePath('/dashboard')
      revalidatePath(`/invoices/${invoice.id}`)
      revalidatePath('/invoices')

    } else if (merchantOrderId.startsWith('inv_')) {
      // ── Full invoice payment ───────────────────────────────────────────────
      const invoiceId = merchantOrderId.replace('inv_', '')
      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId },
        include: { client: { select: { name: true } } },
      })
      if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

      await prisma.payment.create({
        data: {
          invoiceId,
          amount: amountEGP,
          date: new Date(),
          method: 'Paymob',
          notes: `paymob:${paymobTxId}`,
        },
      })

      // Check total paid vs invoice total
      const payments = await prisma.payment.findMany({ where: { invoiceId } })
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
      const newStatus: InvoiceStatus = totalPaid >= invoice.total ? 'PAID' : 'PARTIALLY_PAID'

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: invoice.userId,
          type: 'payment',
          message: `${invoice.client.name} paid ${formatEGP(amountEGP)} — ${invoice.number}`,
          invoiceId: invoice.id,
        },
      })

      revalidatePath('/dashboard')
      revalidatePath(`/invoices/${invoiceId}`)
      revalidatePath('/invoices')
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[paymob/webhook]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function formatEGP(amount: number): string {
  return `EGP ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
