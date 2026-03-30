'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const statuses = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
]

export default function InvoiceFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('status') ?? ''

  function setStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (status) params.set('status', status)
    else params.delete('status')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => setStatus(s.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            current === s.value
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
