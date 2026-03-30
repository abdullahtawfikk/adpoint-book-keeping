'use client'

import { useState, useTransition } from 'react'
import { createClientAction, updateClientAction } from '@/lib/actions/clients'

interface ClientData {
  id?: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  address?: string | null
  notes?: string | null
}

interface ClientFormProps {
  initial?: ClientData
  onSuccess: () => void
}

export default function ClientForm({ initial, onSuccess }: ClientFormProps) {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    company: initial?.company ?? '',
    address: initial?.address ?? '',
    notes: initial?.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setError('')
    startTransition(async () => {
      try {
        if (initial?.id) {
          await updateClientAction(initial.id, form)
        } else {
          await createClientAction(form)
        }
        onSuccess()
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Full Name *" value={form.name} onChange={(v) => set('name', v)} placeholder="Ahmed Khalil" />
      <Field label="Company" value={form.company} onChange={(v) => set('company', v)} placeholder="Acme Corp" />
      <Field label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="ahmed@example.com" />
      <Field label="Phone" type="tel" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+20 100 000 0000" />
      <Field label="Address" value={form.address} onChange={(v) => set('address', v)} placeholder="Cairo, Egypt" />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="Any notes about this client..."
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : initial?.id ? 'Save Changes' : 'Add Client'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string
  value: string | null | undefined
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
      />
    </div>
  )
}
