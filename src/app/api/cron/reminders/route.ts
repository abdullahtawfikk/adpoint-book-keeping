import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

// Use a verified domain sender if configured, otherwise fall back to Resend's shared sender
const FROM_ADDRESS = process.env.RESEND_FROM_DOMAIN
  ? `Adpoint <reminders@${process.env.RESEND_FROM_DOMAIN}>`
  : 'Adpoint <onboarding@resend.dev>'

function getPortalUrl(token: string | null): string | null {
  if (!token || !process.env.NEXT_PUBLIC_APP_URL) return null
  return `${process.env.NEXT_PUBLIC_APP_URL}/portal/${token}`
}

// Called daily by Vercel cron — protected by CRON_SECRET
export async function GET(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Find all overdue unpaid invoices where client has an email
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status:  { in: ['SENT', 'PARTIALLY_PAID'] },
      dueDate: { lt: today },
      client:  { email: { not: null } },
    },
    include: {
      client: {
        select: { id: true, name: true, email: true, portalToken: true, userId: true },
      },
      user: {
        include: { businessSettings: { select: { businessName: true, email: true } } },
      },
    },
  })

  // Also find overdue phases
  const overduePhases = await prisma.invoicePhase.findMany({
    where: {
      status:  'UNPAID',
      dueDate: { lt: today },
      invoice: {
        client: { email: { not: null } },
      },
    },
    include: {
      invoice: {
        include: {
          client: {
            select: { id: true, name: true, email: true, portalToken: true, userId: true },
          },
          user: {
            include: { businessSettings: { select: { businessName: true, email: true } } },
          },
        },
      },
    },
  })

  const sent: string[] = []
  const errors: string[] = []

  // Group phases by invoice to avoid duplicate emails
  // Exclude invoices already covered by overdueInvoices
  const invoiceIds = new Set(overdueInvoices.map(i => i.id))

  // Send reminders for overdue full invoices
  for (const invoice of overdueInvoices) {
    const { client } = invoice
    if (!client.email) continue
    const bizName = invoice.user.businessSettings?.businessName ?? 'Your provider'
    const portalUrl = getPortalUrl(client.portalToken)

    try {
      await resend.emails.send({
        from:    FROM_ADDRESS,
        to:      client.email,
        subject: `Payment Reminder — Invoice ${invoice.number}`,
        html: buildReminderEmail({
          clientName: client.name,
          bizName,
          invoiceNumber: invoice.number,
          amount: invoice.total,
          dueDate: invoice.dueDate,
          portalUrl,
        }),
      })
      sent.push(invoice.id)
    } catch (e) {
      errors.push(invoice.id)
      console.error(`Failed to send reminder for invoice ${invoice.id}:`, e)
    }
  }

  // Send reminders for overdue phases on invoices not already emailed
  for (const phase of overduePhases) {
    const { invoice } = phase
    if (invoiceIds.has(invoice.id)) continue // already sent above
    const { client } = invoice
    if (!client.email) continue
    const bizName = invoice.user.businessSettings?.businessName ?? 'Your provider'
    const portalUrl = getPortalUrl(client.portalToken)

    try {
      await resend.emails.send({
        from:    FROM_ADDRESS,
        to:      client.email,
        subject: `Payment Reminder — ${phase.name} (Invoice ${invoice.number})`,
        html: buildReminderEmail({
          clientName: client.name,
          bizName,
          invoiceNumber: invoice.number,
          phaseName: phase.name,
          amount: phase.amount,
          dueDate: phase.dueDate,
          portalUrl,
        }),
      })
      sent.push(`${invoice.id}:${phase.id}`)
      invoiceIds.add(invoice.id) // don't email same invoice twice for multiple phases
    } catch (e) {
      errors.push(`${invoice.id}:${phase.id}`)
    }
  }

  return NextResponse.json({ sent: sent.length, errors: errors.length })
}

function buildReminderEmail({
  clientName,
  bizName,
  invoiceNumber,
  phaseName,
  amount,
  dueDate,
  portalUrl,
}: {
  clientName: string
  bizName: string
  invoiceNumber: string
  phaseName?: string
  amount: number
  dueDate: Date
  portalUrl: string | null
}) {
  const formattedAmount = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount)
  const formattedDate   = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(dueDate)
  const subject         = phaseName ? `${phaseName} — Invoice ${invoiceNumber}` : `Invoice ${invoiceNumber}`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:#18181b;padding:24px 32px">
      <p style="margin:0;font-size:14px;font-weight:600;color:#a1a1aa;letter-spacing:.05em;text-transform:uppercase">${bizName}</p>
    </div>
    <div style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#18181b">Payment Reminder</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#71717a">Hi ${clientName},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6">
        This is a friendly reminder that the following payment is overdue:
      </p>
      <div style="background:#f4f4f5;border-radius:12px;padding:20px 24px;margin:0 0 24px">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.05em">${subject}</p>
        <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#18181b">${formattedAmount}</p>
        <p style="margin:0;font-size:13px;color:#ef4444">Was due on ${formattedDate}</p>
      </div>
      ${portalUrl ? `
      <a href="${portalUrl}" style="display:block;background:#18181b;color:#fff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;margin:0 0 24px">
        View &amp; Pay Now →
      </a>
      ` : ''}
      <p style="margin:0;font-size:13px;color:#a1a1aa">If you've already made this payment, please disregard this message.</p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f4f4f5">
      <p style="margin:0;font-size:12px;color:#a1a1aa">${bizName}</p>
    </div>
  </div>
</body>
</html>`
}
