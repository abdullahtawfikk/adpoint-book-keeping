'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Profile', href: '/settings/profile' },
  { label: 'Business', href: '/settings/business' },
]

export default function SettingsTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
      {tabs.map(tab => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
