'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBusinessSettings() {
  const userId = await getCurrentUserId()

  let settings = await prisma.businessSettings.findUnique({
    where: { userId },
  })

  // Pre-fill from user profile on first access
  if (!settings) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessName: true, email: true },
    })

    settings = await prisma.businessSettings.create({
      data: {
        userId,
        businessName: user?.businessName ?? null,
        email: user?.email ?? null,
        defaultTaxRate: 0,
        defaultPaymentTerms: 30,
      },
    })
  }

  return settings
}

export async function upsertBusinessSettingsAction(data: {
  businessName: string
  address: string
  phone: string
  email: string
  website: string
  taxNumber: string
  paymentInstructions: string
  footerNote: string
  defaultTaxRate: number
  defaultPaymentTerms: number
}) {
  const userId = await getCurrentUserId()

  const payload = {
    businessName: data.businessName || null,
    address: data.address || null,
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    taxNumber: data.taxNumber || null,
    paymentInstructions: data.paymentInstructions || null,
    footerNote: data.footerNote || null,
    defaultTaxRate: data.defaultTaxRate,
    defaultPaymentTerms: data.defaultPaymentTerms,
  }

  await prisma.businessSettings.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  })

  revalidatePath('/settings/business')
  return { success: true }
}

export async function uploadBusinessLogoAction(formData: FormData) {
  const userId = await getCurrentUserId()
  const file = formData.get('logo') as File
  if (!file || file.size === 0) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const path = `logos/${userId}-biz.${ext}`

  const supabase = await createClient()
  const { error } = await supabase.storage
    .from('business-assets')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return { error: error.message }

  const { data: { publicUrl } } = supabase.storage
    .from('business-assets')
    .getPublicUrl(path)

  await prisma.businessSettings.upsert({
    where: { userId },
    create: { userId, logoUrl: publicUrl },
    update: { logoUrl: publicUrl },
  })

  revalidatePath('/settings/business')
  return { success: true, url: publicUrl }
}
