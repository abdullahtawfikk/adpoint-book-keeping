import SettingsTabs from '@/components/settings/SettingsTabs'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="px-5 md:px-8 pt-5 md:pt-8 pb-0">
        <SettingsTabs />
      </div>
      {children}
    </div>
  )
}
