import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { buildReportDocument } from '@/lib/report-pdf'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('from') ?? ''
  const dateTo = searchParams.get('to') ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const fromDate = new Date(dateFrom)
  const toDate = new Date(dateTo)
  toDate.setHours(23, 59, 59, 999)

  const [invoices, expenses, businessSettings] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id, status: 'PAID', issueDate: { gte: fromDate, lte: toDate } },
      include: { client: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { userId: user.id, date: { gte: fromDate, lte: toDate } },
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
    }).catch(() => null),
  ])

  const revenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const catMap: Record<string, number> = {}
  for (const e of expenses) {
    catMap[e.category] = (catMap[e.category] ?? 0) + e.amount
  }
  const expensesByCategory = Object.entries(catMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  const doc = buildReportDocument(
    { revenue, expenses: totalExpenses, expensesByCategory, dateFrom, dateTo },
    businessSettings
  )
  const buffer = await renderToBuffer(doc)

  const bizName = businessSettings?.businessName || 'Report'

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${bizName}-${dateFrom}-${dateTo}.pdf"`,
    },
  })
}
