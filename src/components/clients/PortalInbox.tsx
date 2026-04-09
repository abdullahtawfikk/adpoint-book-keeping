'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { formatEGP, formatDate } from '@/lib/format'
import {
  confirmClaimAction,
  replyToClientAction,
} from '@/lib/actions/portal-admin'
import { resolveDisputeAction } from '@/lib/actions/portal-features'

/* ── Types ─────────────────────────────────────────────────── */

export interface SerializedClaim {
  id: string
  amount: number
  receiptUrl: string | null
  note: string | null
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  createdAt: string
  invoice: { id: string; number: string; title: string | null }
  phase: { id: string; name: string } | null
}

export interface SerializedMessage {
  id: string
  content: string
  fromClient: boolean
  invoiceId: string | null
  createdAt: string
}

export interface SerializedDispute {
  id: string
  note: string
  resolved: boolean
  createdAt: string
  invoice: { id: string; number: string; title: string | null }
}

interface PortalInboxProps {
  clientId: string
  clientName: string
  initialClaims: SerializedClaim[]
  initialMessages: SerializedMessage[]
  initialDisputes: SerializedDispute[]
}

/* ── Component ─────────────────────────────────────────────── */

export default function PortalInbox({
  clientId,
  clientName,
  initialClaims,
  initialMessages,
  initialDisputes,
}: PortalInboxProps) {
  const [tab,      setTab]      = useState<'messages' | 'claims' | 'disputes'>('messages')
  const [claims,   setClaims]   = useState(initialClaims)
  const [messages, setMessages] = useState(initialMessages)
  const [disputes, setDisputes] = useState(initialDisputes)
  const [draft,    setDraft]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const pendingClaims    = claims.filter(c => c.status === 'PENDING')
  const unreadMessages   = messages.filter(m => m.fromClient).length
  const openDisputes     = disputes.filter(d => !d.resolved)

  function handleResolveDispute(disputeId: string) {
    startTransition(async () => {
      await resolveDisputeAction(disputeId)
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, resolved: true } : d))
    })
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setDraft('')
    startTransition(async () => {
      try {
        await replyToClientAction(clientId, content)
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content,
          fromClient: false,
          invoiceId: null,
          createdAt: new Date().toISOString(),
        }])
      } finally {
        setSending(false)
      }
    })
  }

  function handleConfirmClaim(claimId: string, action: 'CONFIRMED' | 'REJECTED') {
    startTransition(async () => {
      await confirmClaimAction(claimId, action)
      setClaims(prev => prev.map(c =>
        c.id === claimId ? { ...c, status: action } : c
      ))
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Portal Inbox</h2>
          <p className="text-xs text-slate-400 mt-0.5">Messages and payment claims from {clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingClaims.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {pendingClaims.length} pending claim{pendingClaims.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <TabBtn
          label="Messages"
          count={unreadMessages}
          active={tab === 'messages'}
          onClick={() => setTab('messages')}
          countColor="blue"
        />
        <TabBtn
          label="Payment Claims"
          count={pendingClaims.length}
          active={tab === 'claims'}
          onClick={() => setTab('claims')}
          countColor="amber"
        />
        <TabBtn
          label="Disputes"
          count={openDisputes.length}
          active={tab === 'disputes'}
          onClick={() => setTab('disputes')}
          countColor="red"
        />
      </div>

      {/* Messages tab */}
      {tab === 'messages' && (
        <div>
          {/* Thread */}
          <div className="max-h-80 min-h-[120px] overflow-y-auto px-6 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No messages yet.</p>
            )}
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} clientName={clientName} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply form */}
          <form onSubmit={handleSend} className="border-t border-slate-100 p-4">
            <div className="flex items-end gap-3">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(e)
                  }
                }}
                placeholder={`Reply to ${clientName}…`}
                rows={2}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending || isPending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
              >
                {sending || isPending ? (
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
            <p className="mt-1.5 text-[11px] text-slate-400">Enter to send · Shift+Enter for new line</p>
          </form>
        </div>
      )}

      {/* Claims tab */}
      {tab === 'claims' && (
        <div>
          {claims.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No payment claims yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {claims.map(claim => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  isPending={isPending}
                  onConfirm={() => handleConfirmClaim(claim.id, 'CONFIRMED')}
                  onReject={() => handleConfirmClaim(claim.id, 'REJECTED')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disputes tab */}
      {tab === 'disputes' && (
        <div>
          {disputes.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No disputes raised.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {disputes.map(dispute => (
                <div key={dispute.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          Invoice {dispute.invoice.number}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          dispute.resolved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {dispute.resolved ? 'Resolved' : 'Open'}
                        </span>
                      </div>
                      <p className="mt-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-slate-700 border border-red-100">
                        &ldquo;{dispute.note}&rdquo;
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDate(dispute.createdAt)}</p>
                    </div>
                    {!dispute.resolved && (
                      <button
                        type="button"
                        onClick={() => handleResolveDispute(dispute.id)}
                        disabled={isPending}
                        className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function TabBtn({
  label, count, active, onClick, countColor,
}: {
  label: string; count: number; active: boolean
  onClick: () => void; countColor: 'blue' | 'amber' | 'red'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
        active ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          countColor === 'amber' ? 'bg-amber-100 text-amber-700' :
          countColor === 'red'   ? 'bg-red-100 text-red-700' :
                                   'bg-blue-100 text-blue-700'
        }`}>{count}</span>
      )}
    </button>
  )
}

function MessageBubble({ message, clientName }: { message: SerializedMessage; clientName: string }) {
  const isClient = message.fromClient
  return (
    <div className={`flex gap-2 ${isClient ? 'justify-start' : 'justify-end'}`}>
      {isClient && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
          {clientName[0].toUpperCase()}
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
        isClient
          ? 'rounded-tl-sm bg-slate-100 text-slate-800'
          : 'rounded-tr-sm bg-slate-900 text-white'
      }`}>
        <p>{message.content}</p>
        <p className="mt-1 text-[10px] opacity-50">
          {new Date(message.createdAt).toLocaleString([], {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
      {!isClient && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
          Y
        </div>
      )}
    </div>
  )
}

function ClaimRow({ claim, isPending, onConfirm, onReject }: {
  claim: SerializedClaim
  isPending: boolean
  onConfirm: () => void
  onReject: () => void
}) {
  const statusColors = {
    PENDING:   'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    REJECTED:  'bg-red-100 text-red-700',
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{formatEGP(claim.amount)}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[claim.status]}`}>
              {claim.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Invoice {claim.invoice.number}
            {claim.phase && ` · ${claim.phase.name}`}
          </p>
          {claim.note && (
            <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
              &ldquo;{claim.note}&rdquo;
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">{formatDate(claim.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {claim.receiptUrl && (
            <a
              href={claim.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View receipt
            </a>
          )}
          {claim.status === 'PENDING' && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onReject}
                disabled={isPending}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
