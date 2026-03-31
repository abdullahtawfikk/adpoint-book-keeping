import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { buildInvoiceDocument } from '@/lib/invoice-pdf'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const [invoice, businessSettings] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: { client: true, items: true },
    }),
    prisma.businessSettings.findUnique({
      where: { userId: user.id },
      select: {
        businessName: true,
        logoUrl: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        taxNumber: true,
        paymentInstructions: true,
        footerNote: true,
      },
    }),
  ])

  if (!invoice) return new Response('Not found', { status: 404 })

  const doc = buildInvoiceDocument(invoice, businessSettings)
  const buffer = await renderToBuffer(doc)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.number}.pdf"`,
    },
  })
}
