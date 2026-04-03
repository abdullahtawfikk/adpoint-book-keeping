import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    select: { id: true, userId: true, name: true },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const invoiceId = formData.get('invoiceId') as string
  const phaseId   = (formData.get('phaseId') as string | null) || null
  const amount    = parseFloat(formData.get('amount') as string)
  const note      = (formData.get('note') as string | null) || null
  const file      = formData.get('receipt') as File | null

  if (!invoiceId || isNaN(amount)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clientId: client.id },
    select: { id: true, number: true },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  // Upload receipt to Supabase Storage (requires SUPABASE_SERVICE_ROLE_KEY)
  let receiptUrl: string | null = null
  if (file && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      )
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `portal-receipts/${client.id}/${Date.now()}.${ext}`
      const bytes = await file.arrayBuffer()
      const { error } = await supabase.storage
        .from('receipts')
        .upload(path, bytes, { contentType: file.type, upsert: false })

      if (!error) {
        const { data } = supabase.storage.from('receipts').getPublicUrl(path)
        receiptUrl = data.publicUrl
      }
    } catch {
      // non-fatal — proceed without receipt URL
    }
  }

  const claim = await prisma.portalPaymentClaim.create({
    data: {
      clientId:  client.id,
      invoiceId: invoice.id,
      phaseId,
      amount,
      note,
      receiptUrl,
    },
  })

  await prisma.notification.create({
    data: {
      userId:    client.userId,
      type:      'claim',
      message:   `${client.name} submitted a payment claim for invoice ${invoice.number}`,
      invoiceId: invoice.id,
    },
  })

  return NextResponse.json({ ok: true, claimId: claim.id })
}

// Fetch existing claims for this client's invoice
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

  const claims = await prisma.portalPaymentClaim.findMany({
    where: {
      clientId:  client.id,
      ...(invoiceId ? { invoiceId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, invoiceId: true, phaseId: true, amount: true, note: true, receiptUrl: true, status: true, createdAt: true },
  })

  return NextResponse.json(claims)
}
