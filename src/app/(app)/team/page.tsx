import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TeamPageClient from '@/components/team/TeamPageClient'

export default async function TeamPage() {
  const userId = await getCurrentUserId()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [members, monthlyPayroll] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId },
      include: { payments: { orderBy: { date: 'desc' } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.teamPayment.aggregate({
      where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ])

  const rows = members.map(m => ({
    id: m.id,
    name: m.name,
    role: m.role,
    email: m.email,
    phone: m.phone,
    notes: m.notes,
    payments: m.payments.map(p => ({
      id: p.id,
      amount: p.amount,
      date: p.date,
      description: p.description,
    })),
  }))

  return (
    <div className="p-5 md:p-8">
      <TeamPageClient
        members={rows}
        monthlyPayroll={monthlyPayroll._sum.amount ?? 0}
      />
    </div>
  )
}
