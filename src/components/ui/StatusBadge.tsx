const styles: Record<string, string> = {
  DRAFT:         'bg-slate-100 text-slate-600',
  SENT:          'bg-blue-100 text-blue-700',
  PARTIALLY_PAID:'bg-purple-100 text-purple-700',
  PAID:          'bg-emerald-100 text-emerald-700',
  OVERDUE:       'bg-red-100 text-red-700',
  CANCELLED:     'bg-slate-100 text-slate-400',
  PENDING:       'bg-amber-100 text-amber-700',
  UNPAID:        'bg-slate-100 text-slate-500',
}

const labels: Record<string, string> = {
  PARTIALLY_PAID: 'Partial',
}

export default function StatusBadge({ status }: { status: string }) {
  const label = labels[status] ?? (status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '))
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.DRAFT}`}>
      {label}
    </span>
  )
}
