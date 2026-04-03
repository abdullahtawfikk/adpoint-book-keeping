'use client'

import { useState, useRef } from 'react'
import { formatEGP } from '@/lib/format'
import { useLanguage } from './LanguageContext'

interface ClaimPaymentFormProps {
  portalToken: string
  invoiceId: string
  phaseId?: string
  amount: number
  onSuccess: () => void
  onCancel: () => void
}

type SubmitState = 'idle' | 'submitting' | 'done' | 'error'

export default function ClaimPaymentForm({
  portalToken,
  invoiceId,
  phaseId,
  amount,
  onSuccess,
  onCancel,
}: ClaimPaymentFormProps) {
  const { t } = useLanguage()
  const [note,        setNote]        = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitState('submitting')

    const formData = new FormData()
    formData.set('invoiceId', invoiceId)
    formData.set('amount', String(amount))
    if (phaseId)         formData.set('phaseId', phaseId)
    if (note.trim())     formData.set('note', note.trim())
    const file = fileRef.current?.files?.[0]
    if (file)            formData.set('receipt', file)

    try {
      const res = await fetch(`/api/portal/${portalToken}/claim`, {
        method: 'POST',
        body:   formData,
      })
      if (!res.ok) throw new Error('Request failed')
      setSubmitState('done')
      setTimeout(onSuccess, 1800)
    } catch {
      setSubmitState('error')
    }
  }

  if (submitState === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-zinc-800">{t.claimSubmitted}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {t.payAmount}
        </span>
        <span className="text-lg font-bold tabular-nums text-white">{formatEGP(amount)}</span>
      </div>

      {/* Note */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
          {t.claimNote}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.claimNotePlaceholder}
          rows={2}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none"
        />
      </div>

      {/* Receipt upload */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
          {t.uploadReceipt}
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100 transition-colors">
          <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Tap to attach a screenshot</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
          />
        </label>
      </div>

      {/* Error */}
      {submitState === 'error' && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
          Something went wrong — please try again.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitState === 'submitting'}
          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={submitState === 'submitting'}
          className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors disabled:opacity-60"
        >
          {submitState === 'submitting' ? t.submitting : t.submitClaim}
        </button>
      </div>
    </form>
  )
}
