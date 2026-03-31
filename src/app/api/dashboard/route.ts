import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1)) // 1-indexed

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

  // Chart: 6 months ending at selected month
  const sixMonthsAgo = new Date(year, month - 6, 1)

  const in7Days = new Date(now)
  in7Days.setDate(in7Days.getDate() + 7)

  const [
    monthRevenue,
    monthExpenses,
    allTimeRevenue,
    allTimeExpenses,
    unpaidInvoices,
    overdueInvoices,
    last6Revenue,
    last6Expenses,
    recentInvoices,
    recentExpenses,
    upcomingInvoices,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { userId: user.id, status: 'PAID', issueDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { userId: user.id, status: 'PAID' },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { userId: user.id, status: { in: ['SENT', 'OVERDUE'] }, issueDate: { lte: endOfMonth } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { userId: user.id, status: 'OVERDUE', dueDate: { lte: endOfMonth } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { userId: user.id, status: 'PAID', issueDate: { gte: sixMonthsAgo, lte: endOfMonth } },
      select: { total: true, issueDate: true },
    }),
    prisma.expense.findMany({
      where: { userId: user.id, date: { gte: sixMonthsAgo, lte: endOfMonth } },
      select: { amount: true, date: true },
    }),
    prisma.invoice.findMany({
      where: { userId: user.id },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 8,
    }),
    // Upcoming invoices are always real-time (next 7 days from now)
    prisma.invoice.findMany({
      where: {
        userId: user.id,
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lte: in7Days, gte: now },
      },
      include: { client: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
  ])

  // Build 6-month chart data ending at selected month
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

  return NextResponse.json({
    monthRevenue: monthRevenue._sum.total ?? 0,
    monthExpenses: monthExpenses._sum.amount ?? 0,
    allTimeRevenue: allTimeRevenue._sum.total ?? 0,
    allTimeExpenses: allTimeExpenses._sum.amount ?? 0,
    unpaidTotal: unpaidInvoices._sum.total ?? 0,
    unpaidCount: unpaidInvoices._count,
    overdueTotal: overdueInvoices._sum.total ?? 0,
    overdueCount: overdueInvoices._count,
    chartData,
    activity,
    upcomingInvoices: upcomingInvoices.map(inv => ({
      id: inv.id,
      number: inv.number,
      total: inv.total,
      status: inv.status,
      dueDate: inv.dueDate.toISOString(),
      client: inv.client,
    })),
  })
}
