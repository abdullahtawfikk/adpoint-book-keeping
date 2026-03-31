import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExpensesClient from '@/components/expenses/ExpensesClient'
import CategoryChart from '@/components/expenses/CategoryChart'
import { formatEGP } from '@/lib/format'

export default async function ExpensesPage() {
  const userId = await getCurrentUserId()

  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  // Category totals for chart
  const categoryMap: Record<string, number> = {}
  for (const e of expenses) {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount
  }
  const categoryData = Object.entries(categoryMap).map(([category, total]) => ({ category, total }))
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  const rows = expenses.map(e => ({
    id: e.id,
    description: e.description,
    category: e.category as string,
    amount: e.amount,
    date: e.date,
    project: e.project,
    isRecurring: e.isRecurring,
    notes: e.notes,
  }))

  return (
    <div className="p-5 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Main list — takes 2/3 */}
        <div className="lg:col-span-2">
          <ExpensesClient expenses={rows} />
        </div>

        {/* Category summary card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-slate-900">Spending by Category</h2>
            </div>
            <div className="mb-4 pb-4 border-b border-slate-100">
              <p className="text-xs text-slate-500">Total Expenses</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{formatEGP(grandTotal)}</p>
            </div>
            <CategoryChart data={categoryData} grandTotal={grandTotal} />
          </div>
        </div>
      </div>
    </div>
  )
}
