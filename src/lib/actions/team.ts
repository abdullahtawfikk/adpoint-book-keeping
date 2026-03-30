'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createTeamMemberAction(data: {
  name: string
  role?: string
  email?: string
  phone?: string
  notes?: string
}) {
  const userId = await getCurrentUserId()
  await prisma.teamMember.create({
    data: {
      userId,
      name: data.name,
      role: data.role || null,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
    },
  })
  revalidatePath('/team')
}

export async function logTeamPaymentAction(data: {
  memberId: string
  memberName: string
  memberRole?: string
  amount: number
  date: string
  description?: string
}) {
  const userId = await getCurrentUserId()
  await prisma.teamPayment.create({
    data: {
      userId,
      memberId: data.memberId,
      name: data.memberName,
      role: data.memberRole || null,
      amount: data.amount,
      date: new Date(data.date),
      description: data.description || null,
      status: 'PAID',
    },
  })
  revalidatePath('/team')
  revalidatePath('/dashboard')
}
