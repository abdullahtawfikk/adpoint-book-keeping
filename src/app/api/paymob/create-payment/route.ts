import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { paymobAuthToken, paymobCreateOrder, paymobPaymentKey, paymobPaymentUrl } from '@/lib/paymob'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      token: string       // portal token
      invoiceId: string
      phaseId?: string
      amount: number      // EGP
    }

    const { token, invoiceId, phaseId, amount } = body
    if (!token || !invoiceId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify client via portal token
    const client = await prisma.client.findUnique({ where: { portalToken: token } })
    if (!client) return NextResponse.json({ error: 'Invalid token' }, { status: 403 })

    // Verify invoice belongs to this client
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clientId: client.id },
    })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    // Merchant order ID encodes what to update on webhook success
    const merchantOrderId = phaseId
      ? `phase_${phaseId}`
      : `inv_${invoiceId}`

    const amountCents = Math.round(amount * 100)

    // Paymob 3-step flow
    const authToken = await paymobAuthToken()
    const orderId = await paymobCreateOrder(authToken, amountCents, merchantOrderId)
    const nameParts = client.name.trim().split(' ')
    const paymentToken = await paymobPaymentKey(authToken, amountCents, orderId, {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || nameParts[0],
      email: client.email || '',
      phone: client.phone || '',
    })

    return NextResponse.json({ paymentUrl: paymobPaymentUrl(paymentToken) })
  } catch (err) {
    console.error('[paymob/create-payment]', err)
    return NextResponse.json({ error: 'Payment initialisation failed' }, { status: 500 })
  }
}
