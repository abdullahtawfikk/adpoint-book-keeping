import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { cache } from 'react'

// cache() deduplicates calls within a single request render tree
export const getCurrentUserId = cache(async (): Promise<string> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only write to DB on first visit — skip the upsert on every subsequent request
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  })

  if (!existing) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name ?? null,
      },
    })
  }

  return user.id
})
