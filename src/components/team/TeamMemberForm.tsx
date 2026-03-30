'use client'

import { useState, useTransition } from 'react'
import { createTeamMemberAction } from '@/lib/actions/team'

export default function TeamMemberForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '', notes: '' })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setError('')
    startTransition(async () => {
      try {
        await createTeamMemberAction({
          name: form.name,
          role: form.role || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
        })
        onSuccess()
      } catch {
        setError('Something went wrong.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: 'Full Name *', field: 'name', placeholder: 'Omar Fathy' },
        { label: 'Role', field: 'role', placeholder: 'e.g. Designer, Developer' },
        { label: 'Email', field: 'email', placeholder: 'omar@example.com', type: 'email' },
        { label: 'Phone', field: 'phone', placeholder: '+20 100 000 0000', type: 'tel' },
      ].map(({ label, field, placeholder, type = 'text' }) => (
        <div key={field}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
          <input
            type={type}
            value={form[field as keyof typeof form]}
            onChange={e => set(field, e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          placeholder="Contract details, etc."
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Adding...' : 'Add Team Member'}
      </button>
    </form>
  )
}
