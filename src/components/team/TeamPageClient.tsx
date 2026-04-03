'use client'

import { useState } from 'react'
import SlideOver from '@/components/ui/SlideOver'
import TeamMemberForm from '@/components/team/TeamMemberForm'
import LogPaymentModal from '@/components/team/LogPaymentModal'
import { formatEGP, formatDate } from '@/lib/format'

interface Payment {
  id: string
  amount: number
  date: Date
  description: string | null
}

interface Member {
  id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  notes: string | null
  payments: Payment[]
}

export default function TeamPageClient({
  members,
  monthlyPayroll,
}: {
  members: Member[]
  monthlyPayroll: number
}) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Team & Payroll</h1>
          <p className="text-sm text-slate-500 mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''} ·{' '}
            Monthly payroll: <span className="font-medium text-slate-700">{formatEGP(monthlyPayroll)}</span>
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Members */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-16 text-center">
          <p className="text-slate-400 text-sm">No team members yet.</p>
          <button onClick={() => setOpen(true)} className="mt-3 text-sm font-medium text-slate-900 hover:underline">
            Add your first team member →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => {
            const totalPaid = member.payments.reduce((sum, p) => sum + p.amount, 0)
            const isExpanded = expanded === member.id

            return (
              <div key={member.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Member row */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{member.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {member.role && <span className="text-xs text-slate-500">{member.role}</span>}
                        {member.email && <span className="text-xs text-slate-400">· {member.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-slate-900">{formatEGP(totalPaid)}</p>
                      <p className="text-xs text-slate-400">total paid</p>
                    </div>
                    <LogPaymentModal member={member} />
                    <button
                      onClick={() => setExpanded(isExpanded ? null : member.id)}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Payment history */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {member.payments.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">No payments logged yet.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-50">
                            <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Date</th>
                            <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Description</th>
                            <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {member.payments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(p.date)}</td>
                              <td className="px-5 py-3 text-slate-600">{p.description ?? '—'}</td>
                              <td className="px-5 py-3 text-right font-medium text-slate-900">{formatEGP(p.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <SlideOver open={open} onClose={() => setOpen(false)} title="Add Team Member">
        <TeamMemberForm onSuccess={() => setOpen(false)} />
      </SlideOver>
    </>
  )
}
