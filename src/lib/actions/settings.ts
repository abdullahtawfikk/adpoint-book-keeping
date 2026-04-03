'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(data: {
  name: string
  businessName: string
  email: string
}) {
  const userId = await getCurrentUserId()

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name || null,
      businessName: data.businessName || null,
    },
  })

  // Update email in Supabase Auth if changed
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user && user.email !== data.email) {
    await supabase.auth.updateUser({ email: data.email })
  }

  revalidatePath('/settings/profile')
  return { success: true }
}

export async function uploadLogoAction(formData: FormData) {
  const userId = await getCurrentUserId()
  const file = formData.get('logo') as File
  if (!file || file.size === 0) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const path = `logos/${userId}.${ext}`

  const supabase = await createClient()
  const { error } = await supabase.storage
    .from('business-assets')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return { error: error.message }

  const { data: { publicUrl } } = supabase.storage
    .from('business-assets')
    .getPublicUrl(path)

  await prisma.user.update({
    where: { id: userId },
    data: { logoUrl: publicUrl },
  })

  revalidatePath('/settings/profile')
  return { success: true, url: publicUrl }
}
