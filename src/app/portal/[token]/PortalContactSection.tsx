'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from './LanguageContext'

interface Message {
  id: string
  content: string
  fromClient: boolean
  createdAt: string
}

export default function PortalContactSection({ portalToken }: { portalToken: string }) {
  const { t } = useLanguage()
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft,    setDraft]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [loaded,   setLoaded]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/portal/${portalToken}/message?general=true`)
    if (res.ok) {
      const data = await res.json() as Message[]
      setMessages(data)
      setLoaded(true)
    }
  }, [portalToken])

  useEffect(() => {
    if (open && !loaded) fetchMessages()
  }, [open, loaded, fetchMessages])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, open])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setDraft('')
    const res = await fetch(`/api/portal/${portalToken}/message`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content }), // no invoiceId = general message
    })
    if (res.ok) {
      const msg = await res.json() as Message
      setMessages(prev => [...prev, msg])
    }
    setSending(false)
  }

  const unread = messages.filter(m => !m.fromClient).length

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-white border border-zinc-200 px-4 py-4 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
          <svg className="h-5 w-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">{t.contactUs}</p>
          <p className="text-xs text-zinc-400">{t.contactUsSubtitle}</p>
        </div>
        {unread > 0 && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
        <svg className="h-4 w-4 shrink-0 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{t.contactUs}</p>
          <p className="text-[11px] text-zinc-400">{t.contactUsSubtitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-[140px] max-h-72 overflow-y-auto px-4 py-3 space-y-2">
        {!loaded && (
          <p className="py-10 text-center text-xs text-zinc-400">Loading…</p>
        )}
        {loaded && messages.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-zinc-600">{t.contactUs}</p>
            <p className="mt-1 text-xs text-zinc-400">{t.contactUsSubtitle}</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.fromClient ? 'justify-end' : 'justify-start'}`}>
            {!msg.fromClient && (
              <div className="mr-2 mt-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-bold text-zinc-600">
                A
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.fromClient
                ? 'rounded-br-sm bg-zinc-900 text-white'
                : 'rounded-bl-sm bg-zinc-100 text-zinc-800'
            }`}>
              <p>{msg.content}</p>
              <p className="mt-1 text-[10px] opacity-50">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <form onSubmit={send} className="border-t border-zinc-100 p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={t.messagePlaceholder}
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
          >
            {sending ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
