'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createClientAction(data: {
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  notes?: string
}) {
  const userId = await getCurrentUserId()
  await prisma.client.create({
    data: {
      userId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      notes: data.notes || null,
    },
  })
  revalidatePath('/clients')
}

export async function updateClientAction(
  clientId: string,
  data: {
    name: string
    email?: string
    phone?: string
    company?: string
    address?: string
    notes?: string
  }
) {
  const userId = await getCurrentUserId()
  await prisma.client.update({
    where: { id: clientId, userId },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      notes: data.notes || null,
    },
  })
  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
}

export async function deleteClientAction(clientId: string) {
  const userId = await getCurrentUserId()
  await prisma.client.delete({
    where: { id: clientId, userId },
  })
  revalidatePath('/clients')
  return { success: true }
}
