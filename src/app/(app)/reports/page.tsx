import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ReportsClient from '@/components/reports/ReportsClient'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function defaultRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { from, to }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const userId = await getCurrentUserId()
  const { from: rawFrom, to: rawTo } = await searchParams
  const defaults = defaultRange()
  const dateFrom = rawFrom ?? defaults.from
  const dateTo = rawTo ?? defaults.to

  const fromDate = new Date(dateFrom)
  const toDate = new Date(dateTo)
  toDate.setHours(23, 59, 59, 999)

  const [invoices, expenses, sixMonthInvoices, sixMonthExpenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId, status: 'PAID', issueDate: { gte: fromDate, lte: toDate } },
      include: { client: { select: { name: true, company: true } } },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: fromDate, lte: toDate } },
    }),
    prisma.invoice.findMany({
      where: { userId, status: 'PAID' },
      select: { total: true, issueDate: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      select: { amount: true, date: true },
    }),
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

  const now = new Date()
  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const yr = d.getFullYear()
    const mo = d.getMonth()
    const rev = sixMonthInvoices
      .filter(inv => { const id = new Date(inv.issueDate); return id.getFullYear() === yr && id.getMonth() === mo })
      .reduce((sum, inv) => sum + inv.total, 0)
    const exp = sixMonthExpenses
      .filter(e => { const ed = new Date(e.date); return ed.getFullYear() === yr && ed.getMonth() === mo })
      .reduce((sum, e) => sum + e.amount, 0)
    return { month: MONTH_NAMES[mo], Revenue: Math.round(rev), Expenses: Math.round(exp) }
  })

  const clientMap: Record<string, { name: string; company: string | null; total: number }> = {}
  for (const inv of invoices) {
    if (!clientMap[inv.clientId]) {
      clientMap[inv.clientId] = { name: inv.client.name, company: inv.client.company, total: 0 }
    }
    clientMap[inv.clientId].total += inv.total
  }
  const topClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 8)

  return (
    <div className="p-5 md:p-8">
      <ReportsClient
        data={{ revenue, expenses: totalExpenses, expensesByCategory, revenueByMonth, topClients, dateFrom, dateTo }}
      />
    </div>
  )
}
