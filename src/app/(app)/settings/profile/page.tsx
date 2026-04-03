import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/settings/ProfileForm'

export default async function ProfileSettingsPage() {
  const userId = await getCurrentUserId()

  const [dbUser, supabase] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, businessName: true, logoUrl: true },
    }),
    createClient(),
  ])

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Profile & Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and business details</p>
      </div>
      <ProfileForm
        initialData={{
          name: dbUser?.name ?? '',
          businessName: dbUser?.businessName ?? '',
          email: user?.email ?? '',
          logoUrl: dbUser?.logoUrl ?? null,
        }}
      />
    </div>
  )
}
