'use client'

import { useState } from 'react'
import SlideOver from '@/components/ui/SlideOver'
import ClientForm from '@/components/clients/ClientForm'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  notes: string | null
}

export default function ClientDetailActions({ client }: { client: Client }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>

      <SlideOver open={open} onClose={() => setOpen(false)} title="Edit Client">
        <ClientForm initial={client} onSuccess={() => setOpen(false)} />
      </SlideOver>
    </>
  )
}
