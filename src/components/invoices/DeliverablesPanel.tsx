'use client'

import { useState, useTransition, useRef } from 'react'
import { uploadDeliverableAction, deleteDeliverableAction } from '@/lib/actions/portal-features'

interface Deliverable {
  id: string
  name: string
  description: string | null
  fileUrl: string
  fileType: string | null
  createdAt: string
  phaseId: string | null
}

interface Phase {
  id: string
  name: string
}

interface DeliverablesPanelProps {
  invoiceId: string
  phases: Phase[]
  initialDeliverables: Deliverable[]
}

export default function DeliverablesPanel({ invoiceId, phases, initialDeliverables }: DeliverablesPanelProps) {
  const [deliverables, setDeliverables] = useState(initialDeliverables)
  const [showForm,     setShowForm]     = useState(false)
  const [isPending,    startTransition] = useTransition()
  const [name,        setName]          = useState('')
  const [description, setDescription]  = useState('')
  const [phaseId,     setPhaseId]       = useState('')
  const [fileUrl,     setFileUrl]       = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('invoiceId', invoiceId)
    fd.set('name', name)
    if (description) fd.set('description', description)
    if (phaseId)     fd.set('phaseId', phaseId)
    const file = fileRef.current?.files?.[0]
    if (file) {
      fd.set('file', file)
    } else if (fileUrl.trim()) {
      fd.set('fileUrl', fileUrl.trim())
    } else return

    startTransition(async () => {
      const d = await uploadDeliverableAction(fd)
      setDeliverables(prev => [...prev, { ...d, createdAt: d.createdAt.toString() }])
      setShowForm(false)
      setName(''); setDescription(''); setPhaseId(''); setFileUrl('')
      if (fileRef.current) fileRef.current.value = ''
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteDeliverableAction(id)
      setDeliverables(prev => prev.filter(d => d.id !== id))
    })
  }

  function fileIcon(type: string | null) {
    if (!type) return '📎'
    if (type.startsWith('image')) return '🖼'
    if (type.includes('pdf'))    return '📄'
    if (type.includes('video'))  return '🎬'
    if (type.includes('zip') || type.includes('rar')) return '🗜'
    return '📎'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="font-medium text-slate-900">Deliverables</h2>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border-b border-slate-100 px-6 py-4 space-y-3 bg-slate-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Final Logo Files"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional note for the client"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            {phases.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Link to phase</label>
                <select
                  value={phaseId}
                  onChange={e => setPhaseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                >
                  <option value="">None</option>
                  {phases.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">File *</label>
            <input
              ref={fileRef}
              type="file"
              className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            />
            <p className="mt-1.5 text-xs text-slate-400">Or paste a URL:</p>
            <input
              value={fileUrl}
              onChange={e => setFileUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || isPending}
              className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isPending ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {deliverables.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-slate-400">No deliverables yet. Upload files for your client.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {deliverables.map(d => (
            <div key={d.id} className="flex items-center gap-4 px-6 py-3">
              <span className="text-xl">{fileIcon(d.fileType)}</span>
              <div className="min-w-0 flex-1">
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                >
                  {d.name}
                </a>
                {d.description && <p className="text-xs text-slate-400 mt-0.5">{d.description}</p>}
              </div>
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Download
              </a>
              <button
                type="button"
                onClick={() => handleDelete(d.id)}
                disabled={isPending}
                className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
