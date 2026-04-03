'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { updateProfileAction, uploadLogoAction } from '@/lib/actions/settings'

interface Props {
  initialData: {
    name: string
    businessName: string
    email: string
    logoUrl: string | null
  }
}

export default function ProfileForm({ initialData }: Props) {
  const [name, setName] = useState(initialData.name)
  const [businessName, setBusinessName] = useState(initialData.businessName)
  const [email, setEmail] = useState(initialData.email)
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('logo', file)
    const result = await uploadLogoAction(fd)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      setLogoUrl(result.url ?? null)
      showToast('Logo updated', 'success')
    }
    setUploading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateProfileAction({ name, businessName, email })
      if (result.success) {
        showToast('Profile saved successfully', 'success')
      } else {
        showToast('Failed to save profile', 'error')
      }
    })
  }

  const initials = (name || email).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AP'

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">

          {/* Logo upload */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Business Logo</p>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <Image src={logoUrl} alt="Business logo" width={80} height={80} className="object-contain" />
                ) : (
                  <span className="text-slate-900 text-xl font-bold">{initials}</span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  {uploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Logo
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-400 mt-1.5">PNG, JPG or SVG · Max 2MB</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {/* Business name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. AdPoint for Marketing"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1.5">Changing your email will require re-verification</p>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
