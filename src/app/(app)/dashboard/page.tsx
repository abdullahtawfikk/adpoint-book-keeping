import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { formatEGP, formatDate } from '@/lib/format'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import RevenueChart from '@/components/dashboard/RevenueChart'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

async function getDashboardData(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Last 6 months range
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
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
      where: { userId, status: 'PAID', issueDate: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: startOfMonth } },
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
    prisma.invoice.aggregate({
      where: { userId, status: { in: ['SENT', 'OVERDUE'] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { userId, status: 'OVERDUE' },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { userId, status: 'PAID', issueDate: { gte: sixMonthsAgo } },
      select: { total: true, issueDate: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
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
    prisma.invoice.findMany({
      where: {
        userId,
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lte: in7Days, gte: now },
      },
      include: { client: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
  ])

  // Build 6-month chart data
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
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

  // Recent activity: merge invoices + expenses, sort by date, take 8
  type Activity =
    | { type: 'invoice'; id: string; description: string; amount: number; date: Date; status: string }
    | { type: 'expense'; id: string; description: string; amount: number; date: Date; category: string }

  const activity: Activity[] = [
    ...recentInvoices.map(inv => ({
      type: 'invoice' as const,
      id: inv.id,
      description: `Invoice ${inv.number} — ${inv.client.name}`,
      amount: inv.total,
      date: new Date(inv.createdAt),
      status: inv.status,
    })),
    ...recentExpenses.map(exp => ({
      type: 'expense' as const,
      id: exp.id,
      description: exp.description,
      amount: exp.amount,
      date: new Date(exp.date),
      category: exp.category,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8)

  return {
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
    upcomingInvoices,
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

  let data
  try {
    data = await getDashboardData(user.id)
  } catch {
    data = {
      monthRevenue: 0, monthExpenses: 0,
      allTimeRevenue: 0, allTimeExpenses: 0,
      unpaidTotal: 0, unpaidCount: 0,
      overdueTotal: 0, overdueCount: 0,
      chartData: [],
      activity: [],
      upcomingInvoices: [],
    }
  }

  const netProfit = data.monthRevenue - data.monthExpenses
  const currentBalance = data.allTimeRevenue - data.allTimeExpenses
  const displayName = dbUser?.name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-5 md:p-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-slate-900">{greeting}, {displayName}</h1>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s your financial overview</p>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-7">
        <MetricCard
          label="Revenue This Month"
          value={formatEGP(data.monthRevenue)}
          color="emerald"
          icon="↑"
        />
        <MetricCard
          label="Expenses This Month"
          value={formatEGP(data.monthExpenses)}
          color="red"
          icon="↓"
        />
        <MetricCard
          label="Net Profit"
          value={formatEGP(netProfit)}
          sub="this month"
          color={netProfit >= 0 ? 'emerald' : 'red'}
          icon={netProfit >= 0 ? '↑' : '↓'}
          highlight
        />
        <MetricCard
          label="Outstanding Invoices"
          value={formatEGP(data.unpaidTotal)}
          sub={`${data.unpaidCount} unpaid`}
          color="amber"
          icon="!"
        />
        <MetricCard
          label="Overdue Invoices"
          value={formatEGP(data.overdueTotal)}
          sub={`${data.overdueCount} overdue`}
          color="red"
          icon="!"
        />
        <MetricCard
          label="Current Balance"
          value={formatEGP(currentBalance)}
          sub="all time"
          color={currentBalance >= 0 ? 'slate' : 'red'}
          icon="="
        />
      </div>

      {/* Chart + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-medium text-slate-900 mb-5">Revenue vs Expenses</h2>
          <RevenueChart data={data.chartData} />
        </div>

        {/* Upcoming payments */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-900">Due in 7 Days</h2>
          </div>
          {data.upcomingInvoices.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-slate-400 text-sm">No upcoming payments.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.upcomingInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.client.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{inv.number} · Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatEGP(inv.total)}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-900">Recent Activity</h2>
        </div>
        {data.activity.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-400 text-sm">No activity yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.activity.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 px-5 py-3.5">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  item.type === 'invoice'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-red-100 text-red-500'
                }`}>
                  {item.type === 'invoice' ? 'INV' : 'EXP'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{item.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-medium ${item.type === 'expense' ? 'text-red-500' : 'text-slate-900'}`}>
                    {item.type === 'expense' ? '− ' : ''}{formatEGP(item.amount)}
                  </p>
                  {item.type === 'invoice' && (
                    <div className="mt-0.5 flex justify-end">
                      <StatusBadge status={item.status} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  color,
  icon,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  color: 'emerald' | 'red' | 'amber' | 'slate'
  icon: string
  highlight?: boolean
}) {
  const iconBg: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-500',
    amber: 'bg-amber-100 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
  }
  const valueColor: Record<string, string> = {
    emerald: highlight ? 'text-emerald-600' : 'text-slate-900',
    red: highlight ? 'text-red-600' : 'text-slate-900',
    amber: 'text-slate-900',
    slate: 'text-slate-900',
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs text-slate-500 leading-snug">{label}</p>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${iconBg[color]}`}>
          {icon}
        </div>
      </div>
      <p className={`text-lg md:text-xl font-semibold leading-none ${valueColor[color]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  )
}
