import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatEGP, formatDate } from '@/lib/format'
import React from 'react'
import type { ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 10, color: '#0f172a', backgroundColor: '#ffffff' },
  accent:      { height: 4, backgroundColor: '#0f172a' },
  body:        { paddingHorizontal: 48, paddingVertical: 36 },

  // Header
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  logoBox:     { width: 36, height: 36, backgroundColor: '#0f172a', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  logoText:    { color: '#ffffff', fontSize: 11, fontFamily: 'Helvetica-Bold' },
  bizName:     { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  bizMeta:     { fontSize: 8, color: '#64748b', marginTop: 2 },
  stmtLabel:   { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 3, textAlign: 'right' },
  stmtTitle:   { fontSize: 20, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  stmtDate:    { fontSize: 8, color: '#64748b', textAlign: 'right', marginTop: 4 },

  divider:     { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },

  // Client section
  clientLabel: { fontSize: 7.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
  clientName:  { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  clientMeta:  { fontSize: 9, color: '#64748b', marginTop: 2 },

  // Summary row
  summaryRow:  { flexDirection: 'row', gap: 16, marginBottom: 24 },
  summaryBox:  { flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 12 },
  summaryLbl:  { fontSize: 7.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryVal:  { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  summaryGreen:{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#16a34a' },
  summaryRed:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#dc2626' },

  // Invoice table
  tableTitle:  { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  thead:       { flexDirection: 'row', paddingVertical: 6, backgroundColor: '#f8fafc', paddingHorizontal: 8, borderRadius: 4 },
  trow:        { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  colNum:      { width: 72 },
  colTitle:    { flex: 1 },
  colDate:     { width: 72, textAlign: 'right' },
  colTotal:    { width: 80, textAlign: 'right' },
  colStatus:   { width: 60, textAlign: 'right' },
  th:          { fontSize: 7.5, color: '#64748b', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  td:          { fontSize: 9, color: '#334155' },
  tdBold:      { fontSize: 9, color: '#0f172a', fontFamily: 'Helvetica-Bold' },
  tdGreen:     { fontSize: 9, color: '#16a34a', fontFamily: 'Helvetica-Bold' },
  tdRed:       { fontSize: 9, color: '#dc2626' },
  tdAmber:     { fontSize: 9, color: '#d97706' },

  // Phase sub-rows
  phaseRow:    { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, paddingLeft: 24, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },

  // Footer
  footer:      { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  footerText:  { fontSize: 7.5, color: '#94a3b8' },
})

interface StatementClient {
  name: string
  company: string | null
  email: string | null
  phone: string | null
  invoices: StatementInvoice[]
}

interface StatementInvoice {
  id: string
  number: string
  title: string | null
  status: string
  issueDate: Date
  dueDate: Date
  total: number
  phases: { name: string; amount: number; dueDate: Date; status: string }[]
}

interface StatementBusiness {
  businessName: string | null
  logoUrl: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  taxNumber: string | null
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Draft', SENT: 'Sent', PARTIALLY_PAID: 'Partial',
    PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled',
  }
  return map[status] ?? status
}

function statusStyle(status: string) {
  if (status === 'PAID') return s.tdGreen
  if (status === 'OVERDUE') return s.tdRed
  if (status === 'PARTIALLY_PAID') return s.tdAmber
  return s.td
}

export function buildStatementDocument(
  client: StatementClient,
  business: StatementBusiness | null,
): ReactElement<DocumentProps> {
  const bizName   = business?.businessName ?? 'My Business'
  const initials  = bizName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'B'
  const generated = formatDate(new Date())

  const totalInvoiced = client.invoices.reduce((s, inv) => s + inv.total, 0)
  const totalPaid     = client.invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((s, inv) => s + inv.total, 0)
  const outstanding   = client.invoices
    .filter(inv => !['PAID', 'CANCELLED', 'DRAFT'].includes(inv.status))
    .reduce((s, inv) => {
      if (inv.phases.length > 0) {
        return s + inv.phases.filter(p => p.status === 'UNPAID').reduce((t, p) => t + p.amount, 0)
      }
      return s + inv.total
    }, 0)

  const bizMetaLines: string[] = []
  if (business?.address) bizMetaLines.push(business.address)
  if (business?.phone)   bizMetaLines.push(business.phone)
  if (business?.email)   bizMetaLines.push(business.email)

  const footerParts: string[] = [bizName]
  if (business?.email) footerParts.push(business.email)
  if (business?.phone) footerParts.push(business.phone)

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: s.page },

      React.createElement(View, { style: s.accent }),

      React.createElement(View, { style: s.body },

        // ── Header ──────────────────────────────────────────
        React.createElement(View, { style: s.header },
          // Left — business
          React.createElement(View, null,
            React.createElement(View, { style: s.logoBox },
              React.createElement(Text, { style: s.logoText }, initials),
            ),
            React.createElement(Text, { style: s.bizName }, bizName),
            ...bizMetaLines.map((l, i) => React.createElement(Text, { key: String(i), style: s.bizMeta }, l)),
            business?.taxNumber ? React.createElement(Text, { style: s.bizMeta }, `Tax Reg: ${business.taxNumber}`) : null,
          ),
          // Right — statement title
          React.createElement(View, null,
            React.createElement(Text, { style: s.stmtLabel }, 'Account Statement'),
            React.createElement(Text, { style: s.stmtTitle }, client.name),
            client.company ? React.createElement(Text, { style: { ...s.stmtDate, marginTop: 2 } }, client.company) : null,
            React.createElement(Text, { style: s.stmtDate }, `Generated ${generated}`),
          ),
        ),

        React.createElement(View, { style: s.divider }),

        // ── Summary boxes ────────────────────────────────────
        React.createElement(View, { style: s.summaryRow },
          React.createElement(View, { style: s.summaryBox },
            React.createElement(Text, { style: s.summaryLbl }, 'Total Invoiced'),
            React.createElement(Text, { style: s.summaryVal }, formatEGP(totalInvoiced)),
          ),
          React.createElement(View, { style: s.summaryBox },
            React.createElement(Text, { style: s.summaryLbl }, 'Total Paid'),
            React.createElement(Text, { style: s.summaryGreen }, formatEGP(totalPaid)),
          ),
          React.createElement(View, { style: s.summaryBox },
            React.createElement(Text, { style: s.summaryLbl }, 'Outstanding'),
            React.createElement(Text, { style: outstanding > 0 ? s.summaryRed : s.summaryGreen }, formatEGP(outstanding)),
          ),
        ),

        // ── Invoice table ────────────────────────────────────
        React.createElement(Text, { style: s.tableTitle }, 'Invoice History'),

        // Table header
        React.createElement(View, { style: s.thead },
          React.createElement(View, { style: s.colNum },  React.createElement(Text, { style: s.th }, 'Invoice')),
          React.createElement(View, { style: s.colTitle },React.createElement(Text, { style: s.th }, 'Description')),
          React.createElement(View, { style: s.colDate }, React.createElement(Text, { style: s.th }, 'Due Date')),
          React.createElement(View, { style: s.colTotal },React.createElement(Text, { style: s.th }, 'Amount')),
          React.createElement(View, { style: s.colStatus },React.createElement(Text, { style: s.th }, 'Status')),
        ),

        // Invoice rows
        ...client.invoices.flatMap((inv) => {
          const rows = [
            React.createElement(View, { key: inv.id, style: s.trow },
              React.createElement(View, { style: s.colNum },   React.createElement(Text, { style: s.tdBold }, inv.number)),
              React.createElement(View, { style: s.colTitle }, React.createElement(Text, { style: s.td }, inv.title ?? '—')),
              React.createElement(View, { style: s.colDate },  React.createElement(Text, { style: s.td }, formatDate(inv.dueDate))),
              React.createElement(View, { style: s.colTotal }, React.createElement(Text, { style: s.tdBold }, formatEGP(inv.total))),
              React.createElement(View, { style: s.colStatus },React.createElement(Text, { style: statusStyle(inv.status) }, statusLabel(inv.status))),
            ),
            // Phase sub-rows
            ...inv.phases.map((phase, pi) =>
              React.createElement(View, { key: `${inv.id}-${pi}`, style: s.phaseRow },
                React.createElement(View, { style: s.colNum },   React.createElement(Text, { style: { fontSize: 8, color: '#94a3b8' } }, '↳')),
                React.createElement(View, { style: s.colTitle }, React.createElement(Text, { style: { fontSize: 8, color: '#64748b' } }, phase.name)),
                React.createElement(View, { style: s.colDate },  React.createElement(Text, { style: { fontSize: 8, color: '#64748b' } }, formatDate(phase.dueDate))),
                React.createElement(View, { style: s.colTotal }, React.createElement(Text, { style: { fontSize: 8, color: '#334155' } }, formatEGP(phase.amount))),
                React.createElement(View, { style: s.colStatus },React.createElement(Text, { style: { fontSize: 8, color: phase.status === 'PAID' ? '#16a34a' : '#94a3b8' } }, phase.status === 'PAID' ? 'Paid' : 'Unpaid')),
              )
            ),
          ]
          return rows
        }),

        // ── Footer ──────────────────────────────────────────
        React.createElement(View, { style: s.footer },
          React.createElement(Text, { style: s.footerText }, footerParts.join('  ·  ')),
          React.createElement(Text, { style: s.footerText }, `Statement for ${client.name}`),
        ),
      ),
    ),
  ) as ReactElement<DocumentProps>
}
