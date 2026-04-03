import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [branding, notifications] = await Promise.all([
    prisma.businessSettings.findUnique({
      where: { userId: user.id },
      select: { businessName: true, logoUrl: true },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, message: true, invoiceId: true, read: true, createdAt: true },
    }),
  ])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={user} branding={branding} notifications={notifications} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
