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
      portalToken: crypto.randomUUID(),
    },
  })
  revalidatePath('/clients')
}

export async function ensurePortalTokenAction(clientId: string): Promise<string> {
  const userId = await getCurrentUserId()
  const client = await prisma.client.findFirst({ where: { id: clientId, userId } })
  if (!client) throw new Error('Client not found')
  if (client.portalToken) return client.portalToken
  const token = crypto.randomUUID()
  await prisma.client.update({ where: { id: clientId }, data: { portalToken: token } })
  revalidatePath(`/clients/${clientId}`)
  return token
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
