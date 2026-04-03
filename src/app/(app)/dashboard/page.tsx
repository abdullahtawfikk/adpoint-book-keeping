import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import DashboardClient, { type DashboardData } from '@/components/dashboard/DashboardClient'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

async function getDashboardData(userId: string, year: number, month: number): Promise<DashboardData> {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)
  const sixMonthsAgo = new Date(year, month - 6, 1)

  const now = new Date()
  const in7Days = new Date(now)
  in7Days.setDate(in7Days.getDate() + 7)

  const [
    monthRevenue,
    monthExpenses,
    allTimeRevenue,
    allTimeExpenses,
    unpaidNonScheduled,
    unpaidPhases,
    overdueNonScheduled,
    overduePhases,
    last6Revenue,
    last6Expenses,
    recentInvoices,
    recentExpenses,
    upcomingNonScheduled,
    upcomingPhases,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { userId, status: 'PAID', issueDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { userId, status: 'PAID' },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    // Unpaid non-scheduled invoices
    prisma.invoice.aggregate({
      where: { userId, status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] }, paymentStructure: { not: 'SCHEDULED' } },
      _sum: { total: true },
      _count: true,
    }),
    // Unpaid phases from scheduled invoices
    prisma.invoicePhase.aggregate({
      where: { status: 'UNPAID', invoice: { userId, paymentStructure: 'SCHEDULED' } },
      _sum: { amount: true },
      _count: true,
    }),
    // Overdue non-scheduled invoices
    prisma.invoice.aggregate({
      where: { userId, status: 'OVERDUE', paymentStructure: { not: 'SCHEDULED' } },
      _sum: { total: true },
      _count: true,
    }),
    // Overdue unpaid phases
    prisma.invoicePhase.aggregate({
      where: { status: 'UNPAID', dueDate: { lt: now }, invoice: { userId, paymentStructure: 'SCHEDULED' } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { userId, status: 'PAID', issueDate: { gte: sixMonthsAgo, lte: endOfMonth } },
      select: { total: true, issueDate: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: sixMonthsAgo, lte: endOfMonth } },
      select: { amount: true, date: true },
    }),
    prisma.invoice.findMany({
      where: { userId },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 8,
    }),
    // Upcoming non-scheduled invoices due in 7 days
    prisma.invoice.findMany({
      where: {
        userId,
        status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
        paymentStructure: { not: 'SCHEDULED' },
        dueDate: { lte: in7Days, gte: now },
      },
      include: { client: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    // Upcoming phases due in 7 days
    prisma.invoicePhase.findMany({
      where: {
        status: 'UNPAID',
        dueDate: { lte: in7Days, gte: now },
        invoice: { userId, paymentStructure: 'SCHEDULED' },
      },
      include: { invoice: { include: { client: { select: { name: true } } } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
  ])

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 6 + i, 1)
    const yr = d.getFullYear()
    const mo = d.getMonth()

    const rev = last6Revenue
      .filter(inv => {
        const id = new Date(inv.issueDate)
        return id.getFullYear() === yr && id.getMonth() === mo
      })
      .reduce((sum, inv) => sum + inv.total, 0)

    const exp = last6Expenses
      .filter(e => {
        const ed = new Date(e.date)
        return ed.getFullYear() === yr && ed.getMonth() === mo
      })
      .reduce((sum, e) => sum + e.amount, 0)

    return { month: MONTH_NAMES[mo], Revenue: Math.round(rev), Expenses: Math.round(exp) }
  })

  const activity = [
    ...recentInvoices.map(inv => ({
      type: 'invoice' as const,
      id: inv.id,
      description: `Invoice ${inv.number} — ${inv.client.name}`,
      amount: inv.total,
      date: inv.createdAt.toISOString(),
      status: inv.status,
      category: undefined as string | undefined,
    })),
    ...recentExpenses.map(exp => ({
      type: 'expense' as const,
      id: exp.id,
      description: exp.description,
      amount: exp.amount,
      date: new Date(exp.date).toISOString(),
      status: undefined as string | undefined,
      category: exp.category,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  const upcomingItems = [
    ...upcomingNonScheduled.map(inv => ({
      id: inv.id,
      number: inv.number,
      amount: inv.total,
      status: inv.status,
      dueDate: inv.dueDate.toISOString(),
      client: inv.client,
    })),
    ...upcomingPhases.map(phase => ({
      id: phase.invoice.id,
      number: phase.invoice.number,
      amount: phase.amount,
      status: phase.invoice.status,
      dueDate: phase.dueDate.toISOString(),
      client: phase.invoice.client,
      phaseName: phase.name,
    })),
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5)

  return {
    monthRevenue: monthRevenue._sum.total ?? 0,
    monthExpenses: monthExpenses._sum.amount ?? 0,
    allTimeRevenue: allTimeRevenue._sum.total ?? 0,
    allTimeExpenses: allTimeExpenses._sum.amount ?? 0,
    unpaidTotal: (unpaidNonScheduled._sum.total ?? 0) + (unpaidPhases._sum.amount ?? 0),
    unpaidCount: unpaidNonScheduled._count + (unpaidPhases._count ?? 0),
    overdueTotal: (overdueNonScheduled._sum.total ?? 0) + (overduePhases._sum.amount ?? 0),
    overdueCount: overdueNonScheduled._count + (overduePhases._count ?? 0),
    chartData,
    activity,
    upcomingInvoices: upcomingItems,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  })

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-indexed

  let initialData: DashboardData
  try {
    initialData = await getDashboardData(user.id, currentYear, currentMonth)
  } catch {
    initialData = {
      monthRevenue: 0, monthExpenses: 0,
      allTimeRevenue: 0, allTimeExpenses: 0,
      unpaidTotal: 0, unpaidCount: 0,
      overdueTotal: 0, overdueCount: 0,
      chartData: [],
      activity: [],
      upcomingInvoices: [],
    }
  }

  const displayName = dbUser?.name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || 'there'
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <DashboardClient
      greeting={greeting}
      displayName={displayName}
      initialData={initialData}
      initialYear={currentYear}
      initialMonth={currentMonth}
    />
  )
}
