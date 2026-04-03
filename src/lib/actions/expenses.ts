'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { ExpenseCategory } from '@prisma/client'

export async function createExpenseAction(data: {
  description: string
  amount: number
  category: string
  date: string
  project?: string
  isRecurring: boolean
  notes?: string
}) {
  const userId = await getCurrentUserId()
  await prisma.expense.create({
    data: {
      userId,
      description: data.description,
      amount: data.amount,
      category: data.category as ExpenseCategory,
      date: new Date(data.date),
      project: data.project || null,
      isRecurring: data.isRecurring,
      notes: data.notes || null,
    },
  })
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
}

export async function deleteExpenseAction(id: string) {
  const userId = await getCurrentUserId()
  await prisma.expense.delete({ where: { id, userId } })
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
}
