import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { buildInvoiceDocument } from '@/lib/invoice-pdf'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; invoiceId: string }> }
) {
  const { token, invoiceId } = await params

  // Look up the client by portal token
  const client = await prisma.client.findUnique({
    where: { portalToken: token },
  })
  if (!client) return new Response('Not found', { status: 404 })

  // Verify the invoice belongs to this client
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clientId: client.id },
    include: { client: true, items: true, phases: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!invoice) return new Response('Not found', { status: 404 })

  const businessSettings = await prisma.businessSettings.findUnique({
    where: { userId: client.userId },
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
  }).catch(() => null)

  const doc = buildInvoiceDocument(invoice, businessSettings)
  const buffer = await renderToBuffer(doc)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.number}.pdf"`,
    },
  })
}
