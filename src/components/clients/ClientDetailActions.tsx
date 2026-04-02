'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import SlideOver from '@/components/ui/SlideOver'
import ClientForm from '@/components/clients/ClientForm'
import { deleteClientAction, ensurePortalTokenAction } from '@/lib/actions/clients'

const PORTAL_BASE = 'https://adpoint-books.vercel.app'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  notes: string | null
}

export default function ClientDetailActions({
  client,
  hasPaidInvoices,
  portalToken,
}: {
  client: Client
  hasPaidInvoices: boolean
  portalToken: string | null
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copyPending, setCopyPending] = useState(false)
  const router = useRouter()

  async function handleCopyPortalLink() {
    setCopyPending(true)
    try {
      let token = portalToken
      if (!token) {
        token = await ensurePortalTokenAction(client.id)
      }
      await navigator.clipboard.writeText(`${PORTAL_BASE}/portal/${token}`)
      setToast('Portal link copied!')
      setTimeout(() => setToast(null), 2500)
    } finally {
      setCopyPending(false)
    }
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteClientAction(client.id)
      if (result.success) {
        setDeleteOpen(false)
        setToast(`${client.name} deleted`)
        setTimeout(() => router.push('/clients'), 1200)
      }
    })
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span>✓</span>
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Copy Portal Link */}
        <button
          onClick={handleCopyPortalLink}
          disabled={copyPending}
          className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {copyPending ? 'Copying...' : 'Copy Portal Link'}
        </button>

        {/* Edit */}
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>

        {/* Delete */}
        <button
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>

      {/* Edit slide-over */}
      <SlideOver open={editOpen} onClose={() => setEditOpen(false)} title="Edit Client">
        <ClientForm initial={client} onSuccess={() => setEditOpen(false)} />
      </SlideOver>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !isPending && setDeleteOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              Delete {client.name}?
            </h2>
            <p className="text-sm text-slate-500 mb-4">This cannot be undone.</p>

            {hasPaidInvoices && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs text-amber-800">
                  This client has paid invoices. All invoice history will be permanently deleted.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={isPending}
                className="flex-1 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Deleting...
                  </>
                ) : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
