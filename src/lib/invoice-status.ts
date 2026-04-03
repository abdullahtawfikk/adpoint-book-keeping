import { InvoiceStatus, PaymentStructure } from '@prisma/client'

type PhaseLike = {
  status: 'PAID' | 'UNPAID'
  dueDate: Date | string
}

export function getScheduledInvoiceStatus(
  phases: PhaseLike[],
  now = new Date(),
): InvoiceStatus {
  if (phases.length === 0) return 'SENT'

  const paidCount = phases.filter((phase) => phase.status === 'PAID').length
  const unpaidCount = phases.length - paidCount
  const hasOverdueUnpaid = phases.some(
    (phase) => phase.status === 'UNPAID' && new Date(phase.dueDate) < now,
  )

  if (unpaidCount === 0) return 'PAID'
  if (paidCount > 0) return 'PARTIALLY_PAID'
  if (hasOverdueUnpaid) return 'OVERDUE'
  return 'SENT'
}

export function getInvoiceDisplayStatus({
  status,
  paymentStructure,
  phases,
}: {
  status: InvoiceStatus
  paymentStructure: PaymentStructure
  phases: PhaseLike[]
}): InvoiceStatus {
  if (status === 'DRAFT' || status === 'CANCELLED') return status
  if (paymentStructure !== 'SCHEDULED' || phases.length === 0) return status
  return getScheduledInvoiceStatus(phases)
}
