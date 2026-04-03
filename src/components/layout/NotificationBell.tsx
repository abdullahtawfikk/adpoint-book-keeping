'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { markNotificationsReadAction } from '@/lib/actions/notifications'

interface Notification {
  id: string
  message: string
  invoiceId: string | null
  read: boolean
  createdAt: Date
}

export default function NotificationBell({
  initial,
}: {
  initial: Notification[]
}) {
  const [notifications, setNotifications] = useState(initial)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const unread = notifications.filter(n => !n.read).length

  // Poll every 30s
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router])

  // Sync when server re-renders pass new props
  useEffect(() => {
    setNotifications(initial)
  }, [initial])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleOpen() {
    const wasOpen = open
    setOpen(!wasOpen)
    if (!wasOpen && unread > 0) {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      await markNotificationsReadAction(unreadIds)
    }
  }

  function handleClick(n: Notification) {
    setOpen(false)
    if (n.invoiceId) {
      router.push(`/invoices/${n.invoiceId}`)
    }
  }

  function timeAgo(date: Date): string {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-400">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <div className={!n.read ? '' : 'pl-3.5'}>
                      <p className="text-sm text-slate-800 leading-snug">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
