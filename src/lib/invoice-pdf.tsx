import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { formatEGP, formatDate } from '@/lib/format'
import React from 'react'
import type { ReactElement } from 'react'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#0f172a', backgroundColor: '#ffffff' },

  // Top accent bar
  accentBar: { height: 4, backgroundColor: '#0f172a' },

  // Main content padding
  content: { paddingHorizontal: 48, paddingVertical: 36 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 },
  logoBox: { width: 38, height: 38, backgroundColor: '#0f172a', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoText: { color: '#ffffff', fontSize: 12, fontFamily: 'Helvetica-Bold' },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  companyMeta: { fontSize: 8.5, color: '#64748b', marginTop: 2 },

  // Invoice label block (top right)
  invoiceLabelBlock: { alignItems: 'flex-end' },
  invoiceLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  invoiceNumber: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  invoiceTitle: { fontSize: 9, color: '#64748b', marginTop: 3 },

  // Dates strip
  datesStrip: { flexDirection: 'row', gap: 32, marginTop: 10, justifyContent: 'flex-end' },
  dateItem: { alignItems: 'flex-end' },
  dateLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  dateValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' },

  // Status badge for PAID
  statusPaid: { marginTop: 8, alignSelf: 'flex-end', backgroundColor: '#dcfce7', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  statusPaidText: { fontSize: 8, color: '#16a34a', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Divider
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 24 },
  dividerLight: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 8 },

  // Bill To
  billSection: { marginBottom: 28 },
  sectionLabel: { fontSize: 7.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 7 },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  clientMeta: { fontSize: 9, color: '#64748b', marginTop: 2.5 },

  // Table
  tableHeader: { flexDirection: 'row', paddingVertical: 7, backgroundColor: '#f8fafc', paddingHorizontal: 8, borderRadius: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  colDesc: { flex: 1 },
  colQty: { width: 44, textAlign: 'center' },
  colPrice: { width: 76, textAlign: 'right' },
  colTotal: { width: 76, textAlign: 'right' },
  thText: { fontSize: 8, color: '#64748b', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  tdText: { fontSize: 9, color: '#334155' },
  tdBold: { fontSize: 9, color: '#0f172a', fontFamily: 'Helvetica-Bold' },

  // Totals
  totalsWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, marginBottom: 28 },
  totalsBox: { width: 210 },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5 },
  tLabel: { fontSize: 9, color: '#64748b' },
  tValue: { fontSize: 9, color: '#0f172a' },
  tDiscount: { fontSize: 9, color: '#dc2626' },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#0f172a', borderRadius: 6, marginTop: 6 },
  grandLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  grandValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#ffffff' },

  // Notes
  notesBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 24 },
  notesText: { fontSize: 8.5, color: '#64748b', lineHeight: 1.6 },

  // Payment instructions
  paymentBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 14, marginBottom: 24 },
  paymentTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  paymentRow: { flexDirection: 'row', marginBottom: 4 },
  paymentKey: { width: 90, fontSize: 8.5, color: '#94a3b8' },
  paymentVal: { flex: 1, fontSize: 8.5, color: '#0f172a', fontFamily: 'Helvetica-Bold' },

  // Footer
  footer: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft: { fontSize: 8, color: '#94a3b8' },
  footerRight: { fontSize: 8, color: '#94a3b8' },
})

interface InvoiceData {
  number: string
  title: string | null
  status: string
  issueDate: Date
  dueDate: Date
  subtotal: number
  discount: number
  tax: number
  total: number
  notes: string | null
  client: {
    name: string
    company: string | null
    email: string | null
    phone: string | null
    address: string | null
  }
  items: {
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]
}

export function buildInvoiceDocument(invoice: InvoiceData): ReactElement<DocumentProps> {
  const taxAmount = (invoice.subtotal - invoice.discount) * (invoice.tax / 100)
  const isPaid = invoice.status === 'PAID'

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: s.page },

      // Accent bar
      React.createElement(View, { style: s.accentBar }),

      React.createElement(
        View,
        { style: s.content },

        // ── Header ──────────────────────────────────────────────────────────
        React.createElement(
          View,
          { style: s.header },
          // Left: logo + company
          React.createElement(
            View,
            null,
            React.createElement(View, { style: s.logoBox },
              React.createElement(Text, { style: s.logoText }, 'AP')
            ),
            React.createElement(Text, { style: s.companyName }, 'AdPoint'),
            React.createElement(Text, { style: s.companyMeta }, 'Cairo, Egypt'),
            React.createElement(Text, { style: s.companyMeta }, 'advntgepoint@gmail.com'),
            React.createElement(Text, { style: s.companyMeta }, '+20 115 222 3784'),
            React.createElement(Text, { style: s.companyMeta }, 'adpoint.agency'),
          ),
          // Right: INVOICE label + number + dates
          React.createElement(
            View,
            { style: s.invoiceLabelBlock },
            React.createElement(Text, { style: s.invoiceLabel }, 'Invoice'),
            React.createElement(Text, { style: s.invoiceNumber }, invoice.number),
            invoice.title ? React.createElement(Text, { style: s.invoiceTitle }, invoice.title) : null,
            React.createElement(
              View,
              { style: s.datesStrip },
              React.createElement(
                View,
                { style: s.dateItem },
                React.createElement(Text, { style: s.dateLabel }, 'Issue Date'),
                React.createElement(Text, { style: s.dateValue }, formatDate(invoice.issueDate)),
              ),
              React.createElement(
                View,
                { style: s.dateItem },
                React.createElement(Text, { style: s.dateLabel }, 'Due Date'),
                React.createElement(Text, { style: s.dateValue }, formatDate(invoice.dueDate)),
              ),
            ),
            isPaid
              ? React.createElement(View, { style: s.statusPaid },
                  React.createElement(Text, { style: s.statusPaidText }, 'Paid')
                )
              : null,
          )
        ),

        // Divider
        React.createElement(View, { style: s.divider }),

        // ── Bill To ─────────────────────────────────────────────────────────
        React.createElement(
          View,
          { style: s.billSection },
          React.createElement(Text, { style: s.sectionLabel }, 'Bill To'),
          React.createElement(Text, { style: s.clientName }, invoice.client.name),
          invoice.client.company ? React.createElement(Text, { style: s.clientMeta }, invoice.client.company) : null,
          invoice.client.email ? React.createElement(Text, { style: s.clientMeta }, invoice.client.email) : null,
          invoice.client.phone ? React.createElement(Text, { style: s.clientMeta }, invoice.client.phone) : null,
          invoice.client.address ? React.createElement(Text, { style: s.clientMeta }, invoice.client.address) : null,
        ),

        // ── Line Items Table ─────────────────────────────────────────────────
        React.createElement(
          View,
          { style: { marginBottom: 0 } },
          // Table header
          React.createElement(
            View,
            { style: s.tableHeader },
            React.createElement(View, { style: s.colDesc }, React.createElement(Text, { style: s.thText }, 'Description')),
            React.createElement(View, { style: s.colQty }, React.createElement(Text, { style: s.thText }, 'Qty')),
            React.createElement(View, { style: s.colPrice }, React.createElement(Text, { style: s.thText }, 'Unit Price')),
            React.createElement(View, { style: s.colTotal }, React.createElement(Text, { style: s.thText }, 'Total')),
          ),
          // Rows
          ...invoice.items.map((item, i) =>
            React.createElement(
              View,
              { key: String(i), style: s.tableRow },
              React.createElement(View, { style: s.colDesc }, React.createElement(Text, { style: s.tdText }, item.description)),
              React.createElement(View, { style: s.colQty }, React.createElement(Text, { style: s.tdText }, String(item.quantity))),
              React.createElement(View, { style: s.colPrice }, React.createElement(Text, { style: s.tdText }, formatEGP(item.unitPrice))),
              React.createElement(View, { style: s.colTotal }, React.createElement(Text, { style: s.tdBold }, formatEGP(item.total))),
            )
          ),
        ),

        // ── Totals ───────────────────────────────────────────────────────────
        React.createElement(
          View,
          { style: s.totalsWrap },
          React.createElement(
            View,
            { style: s.totalsBox },
            React.createElement(View, { style: s.tRow },
              React.createElement(Text, { style: s.tLabel }, 'Subtotal'),
              React.createElement(Text, { style: s.tValue }, formatEGP(invoice.subtotal)),
            ),
            invoice.discount > 0
              ? React.createElement(View, { style: s.tRow },
                  React.createElement(Text, { style: s.tLabel }, 'Discount'),
                  React.createElement(Text, { style: s.tDiscount }, `− ${formatEGP(invoice.discount)}`),
                )
              : null,
            invoice.tax > 0
              ? React.createElement(View, { style: s.tRow },
                  React.createElement(Text, { style: s.tLabel }, `Tax (${invoice.tax}%)`),
                  React.createElement(Text, { style: s.tValue }, formatEGP(taxAmount)),
                )
              : null,
            React.createElement(View, { style: s.grandRow },
              React.createElement(Text, { style: s.grandLabel }, 'Total Due'),
              React.createElement(Text, { style: s.grandValue }, formatEGP(invoice.total)),
            ),
          )
        ),

        // ── Notes ────────────────────────────────────────────────────────────
        invoice.notes
          ? React.createElement(
              View,
              { style: s.notesBox },
              React.createElement(Text, { style: s.sectionLabel }, 'Notes'),
              React.createElement(Text, { style: s.notesText }, invoice.notes),
            )
          : null,

        // ── Payment Instructions ─────────────────────────────────────────────
        React.createElement(
          View,
          { style: s.paymentBox },
          React.createElement(Text, { style: s.paymentTitle }, 'Payment Instructions'),
          React.createElement(View, { style: s.paymentRow },
            React.createElement(Text, { style: s.paymentKey }, 'Bank Name'),
            React.createElement(Text, { style: s.paymentVal }, 'Banque Misr'),
          ),
          React.createElement(View, { style: s.paymentRow },
            React.createElement(Text, { style: s.paymentKey }, 'Account Name'),
            React.createElement(Text, { style: s.paymentVal }, 'AdPoint for Marketing'),
          ),
          React.createElement(View, { style: s.paymentRow },
            React.createElement(Text, { style: s.paymentKey }, 'Account Number'),
            React.createElement(Text, { style: s.paymentVal }, '1234567890'),
          ),
          React.createElement(View, { style: s.paymentRow },
            React.createElement(Text, { style: s.paymentKey }, 'Reference'),
            React.createElement(Text, { style: s.paymentVal }, invoice.number),
          ),
          React.createElement(View, { style: { ...s.paymentRow, marginBottom: 0 } },
            React.createElement(Text, { style: s.paymentKey }, 'Currency'),
            React.createElement(Text, { style: s.paymentVal }, 'EGP — Egyptian Pound'),
          ),
        ),

        // ── Footer ───────────────────────────────────────────────────────────
        React.createElement(
          View,
          { style: s.footer },
          React.createElement(Text, { style: s.footerLeft }, 'AdPoint  ·  advntgepoint@gmail.com  ·  +20 115 222 3784'),
          React.createElement(Text, { style: s.footerRight }, 'adpoint.agency'),
        ),
      )
    )
  ) as ReactElement<DocumentProps>
}
