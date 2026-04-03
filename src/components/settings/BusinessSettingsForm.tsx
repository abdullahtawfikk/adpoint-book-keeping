'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { upsertBusinessSettingsAction, uploadBusinessLogoAction } from '@/lib/actions/business-settings'

interface InitialData {
  businessName: string | null
  logoUrl: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  taxNumber: string | null
  paymentInstructions: string | null
  footerNote: string | null
  defaultTaxRate: number
  defaultPaymentTerms: number
}

export default function BusinessSettingsForm({ initialData }: { initialData: InitialData }) {
  const [businessName, setBusinessName] = useState(initialData.businessName ?? '')
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl)
  const [address, setAddress] = useState(initialData.address ?? '')
  const [phone, setPhone] = useState(initialData.phone ?? '')
  const [email, setEmail] = useState(initialData.email ?? '')
  const [website, setWebsite] = useState(initialData.website ?? '')
  const [taxNumber, setTaxNumber] = useState(initialData.taxNumber ?? '')
  const [paymentInstructions, setPaymentInstructions] = useState(initialData.paymentInstructions ?? '')
  const [footerNote, setFooterNote] = useState(initialData.footerNote ?? '')
  const [defaultTaxRate, setDefaultTaxRate] = useState(String(initialData.defaultTaxRate || ''))
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(String(initialData.defaultPaymentTerms || 30))

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
    const result = await uploadBusinessLogoAction(fd)
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
      const result = await upsertBusinessSettingsAction({
        businessName,
        address,
        phone,
        email,
        website,
        taxNumber,
        paymentInstructions,
        footerNote,
        defaultTaxRate: parseFloat(defaultTaxRate) || 0,
        defaultPaymentTerms: parseInt(defaultPaymentTerms) || 30,
      })
      if (result.success) {
        showToast('Business settings saved', 'success')
      } else {
        showToast('Failed to save settings', 'error')
      }
    })
  }

  const initials = (businessName || 'B').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
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

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Logo + Business Name */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Branding</h2>

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

          {/* Business name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Acme Co."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Contact Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Address</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={3}
              placeholder="123 Main St&#10;Cairo, Egypt"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+20 115 222 3784"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="hello@company.com"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tax Registration Number
                <span className="ml-1.5 text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={e => setTaxNumber(e.target.value)}
                placeholder="123-456-789"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Invoice defaults */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Invoice Defaults</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={defaultTaxRate}
                onChange={e => setDefaultTaxRate(e.target.value)}
                placeholder="e.g. 14"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1.5">Pre-fills the tax field on new invoices</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Payment Terms (days)</label>
              <input
                type="number"
                min="0"
                value={defaultPaymentTerms}
                onChange={e => setDefaultPaymentTerms(e.target.value)}
                placeholder="e.g. 30"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1.5">Sets the due date on new invoices</p>
            </div>
          </div>
        </div>

        {/* Invoice content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Invoice Content</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Instructions / Bank Details</label>
            <textarea
              value={paymentInstructions}
              onChange={e => setPaymentInstructions(e.target.value)}
              rows={5}
              placeholder="Bank: Banque Misr&#10;Account Name: Your Company&#10;Account Number: 1234567890&#10;Currency: EGP"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400 mt-1.5">Appears at the bottom of every invoice PDF</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Invoice Footer Note
              <span className="ml-1.5 text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={footerNote}
              onChange={e => setFooterNote(e.target.value)}
              rows={2}
              placeholder="Thank you for your business!"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400 mt-1.5">Small note at the very bottom of every invoice</p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : 'Save Settings'}
          </button>
        </div>
      </form>
    </>
  )
}
