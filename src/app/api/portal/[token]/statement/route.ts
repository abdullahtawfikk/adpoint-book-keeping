import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { buildStatementDocument } from '@/lib/statement-pdf'
import React from 'react'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    include: {
      invoices: {
        orderBy: { createdAt: 'desc' },
        include: {
          phases: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const settings = await prisma.businessSettings.findUnique({
    where: { userId: client.userId },
    select: {
      businessName: true, logoUrl: true, address: true,
      phone: true, email: true, website: true, taxNumber: true,
    },
  }).catch(() => null)

  const doc = buildStatementDocument(client, settings ?? null)
  const buffer = await renderToBuffer(React.createElement(() => doc) as React.ReactElement)

  const filename = `statement-${client.name.replace(/\s+/g, '-').toLowerCase()}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
