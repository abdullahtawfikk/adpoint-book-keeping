import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  await prisma.client.updateMany({
    where: { portalToken: token },
    data: { portalLastSeen: new Date() },
  })

  return NextResponse.json({ ok: true })
}
