import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'

/**
 * Validates the current session with Supabase (one network call per request).
 * Wrapped in React cache() so it's deduplicated across layout + page + any
 * server component in the same render tree.
 */
export const getAuthUser = cache(async (): Promise<User> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
})

/**
 * Returns the current user's DB id, creating their record on first login.
 * Calls getAuthUser() internally — if the layout already called it, this
 * is a cache hit (no extra network call).
 */
export const getCurrentUserId = cache(async (): Promise<string> => {
  const user = await getAuthUser()

  // Only creates the DB record on first ever login — skip the check if record exists
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  })
  if (!existing) {
    await prisma.user.create({
      data: {
        id:    user.id,
        email: user.email!,
        name:  user.user_metadata?.name ?? null,
      },
    })
  }

  return user.id
})
