import { getBusinessSettings } from '@/lib/actions/business-settings'
import BusinessSettingsForm from '@/components/settings/BusinessSettingsForm'

export default async function BusinessSettingsPage() {
  const settings = await getBusinessSettings()

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Business Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Customize how your business appears on invoices</p>
      </div>
      <BusinessSettingsForm initialData={settings} />
    </div>
  )
}
