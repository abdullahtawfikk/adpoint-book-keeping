'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markNotificationsReadAction(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { read: true },
  })

  revalidatePath('/dashboard')
}
