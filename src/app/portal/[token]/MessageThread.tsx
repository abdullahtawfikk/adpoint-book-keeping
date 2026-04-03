'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from './LanguageContext'

/* ── Types ────────────────────────���─────────────────────────── */

interface Message {
  id: string
  content: string
  fromClient: boolean
  createdAt: string
}

interface MessageThreadProps {
  portalToken: string
  invoiceId: string
  invoiceNumber: string
}

/* ── Component ──────────────────────────────────────────────── */

export default function MessageThread({ portalToken, invoiceId, invoiceNumber }: MessageThreadProps) {
  const { t } = useLanguage()
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft,    setDraft]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [loaded,   setLoaded]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/portal/${portalToken}/message?invoiceId=${invoiceId}`)
    if (res.ok) {
      const data = await res.json() as Message[]
      setMessages(data)
      setLoaded(true)
    }
  }, [portalToken, invoiceId])

  useEffect(() => {
    if (open && !loaded) fetchMessages()
  }, [open, loaded, fetchMessages])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    setSending(true)
    setDraft('')

    const res = await fetch(`/api/portal/${portalToken}/message`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ invoiceId, content }),
    })

    if (res.ok) {
      const msg = await res.json() as Message
      setMessages(prev => [...prev, msg])
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as unknown as React.FormEvent)
    }
  }

  const unread = 0 // client never has unread (they wrote them)

  return (
    <div>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
          open
            ? 'border-zinc-300 bg-zinc-100 text-zinc-700'
            : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
        }`}
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {t.messages}
        {messages.length > 0 && (
          <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs font-semibold text-zinc-600 tabular-nums">
            {messages.length}
          </span>
        )}
        {unread > 0 && (
          <span className="h-2 w-2 rounded-full bg-blue-500" />
        )}
        <svg
          className={`ml-auto h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Thread */}
      {open && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {/* Header */}
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-xs font-semibold text-zinc-500">
              {t.messages} · {invoiceNumber}
            </p>
          </div>

          {/* Messages */}
          <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3">
            {!loaded && (
              <p className="py-4 text-center text-xs text-zinc-400">Loading…</p>
            )}
            {loaded && messages.length === 0 && (
              <p className="py-4 text-center text-xs text-zinc-400">{t.sendMessage}</p>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <form onSubmit={sendMessage} className="border-t border-zinc-100 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.messagePlaceholder}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-zinc-400">Enter to send · Shift+Enter for new line</p>
          </form>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isClient = message.fromClient

  return (
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isClient
            ? 'rounded-br-sm bg-zinc-900 text-white'
            : 'rounded-bl-sm bg-zinc-100 text-zinc-800'
        }`}
      >
        <p>{message.content}</p>
        <p className={`mt-1 text-[10px] ${isClient ? 'text-zinc-400' : 'text-zinc-400'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
