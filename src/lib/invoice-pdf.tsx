import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { formatEGP, formatDate } from '@/lib/format'
import React from 'react'
import type { ReactElement } from 'react'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 48,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: {
    width: 36,
    height: 36,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  companyDetail: { fontSize: 9, color: '#64748b', marginTop: 2 },
  invoiceNumber: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#0f172a', textAlign: 'right' },
  invoiceTitle: { fontSize: 10, color: '#64748b', textAlign: 'right', marginTop: 2 },
  dateRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, gap: 16 },
  dateLabel: { fontSize: 9, color: '#94a3b8' },
  dateValue: { fontSize: 9, color: '#0f172a', fontFamily: 'Helvetica-Bold' },
  billTo: { marginBottom: 32 },
  sectionLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  clientDetail: { fontSize: 9, color: '#64748b', marginTop: 2 },
  table: { marginBottom: 32 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: 'center' },
  colPrice: { width: 80, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },
  headerText: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  cellText: { fontSize: 9, color: '#334155' },
  cellTextBold: { fontSize: 9, color: '#0f172a', fontFamily: 'Helvetica-Bold' },
  totalsContainer: { alignItems: 'flex-end', marginBottom: 32 },
  totalsBox: { width: 200 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: '#64748b' },
  totalValue: { fontSize: 9, color: '#0f172a' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: '#e2e8f0',
  },
  grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  notes: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 6 },
  notesText: { fontSize: 9, color: '#64748b', lineHeight: 1.5 },
})

interface InvoiceData {
  number: string
  title: string | null
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

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(View, { style: styles.logo },
            React.createElement(Text, { style: styles.logoText }, 'AP')
          ),
          React.createElement(Text, { style: styles.companyName }, 'AdPoint'),
          React.createElement(Text, { style: styles.companyDetail }, 'Cairo, Egypt'),
          React.createElement(Text, { style: styles.companyDetail }, 'advntgepoint@gmail.com'),
          React.createElement(Text, { style: styles.companyDetail }, '+20 115 222 3784'),
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.invoiceNumber }, invoice.number),
          invoice.title ? React.createElement(Text, { style: styles.invoiceTitle }, invoice.title) : null,
          React.createElement(View, { style: styles.dateRow },
            React.createElement(Text, { style: styles.dateLabel }, 'Issue Date'),
            React.createElement(Text, { style: styles.dateValue }, formatDate(invoice.issueDate)),
          ),
          React.createElement(View, { style: styles.dateRow },
            React.createElement(Text, { style: styles.dateLabel }, 'Due Date'),
            React.createElement(Text, { style: styles.dateValue }, formatDate(invoice.dueDate)),
          ),
        )
      ),
      // Bill To
      React.createElement(
        View,
        { style: styles.billTo },
        React.createElement(Text, { style: styles.sectionLabel }, 'Bill To'),
        React.createElement(Text, { style: styles.clientName }, invoice.client.name),
        invoice.client.company ? React.createElement(Text, { style: styles.clientDetail }, invoice.client.company) : null,
        invoice.client.email ? React.createElement(Text, { style: styles.clientDetail }, invoice.client.email) : null,
        invoice.client.phone ? React.createElement(Text, { style: styles.clientDetail }, invoice.client.phone) : null,
        invoice.client.address ? React.createElement(Text, { style: styles.clientDetail }, invoice.client.address) : null,
      ),
      // Table
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(View, { style: styles.colDesc }, React.createElement(Text, { style: styles.headerText }, 'Description')),
          React.createElement(View, { style: styles.colQty }, React.createElement(Text, { style: styles.headerText }, 'Qty')),
          React.createElement(View, { style: styles.colPrice }, React.createElement(Text, { style: styles.headerText }, 'Unit Price')),
          React.createElement(View, { style: styles.colTotal }, React.createElement(Text, { style: styles.headerText }, 'Total')),
        ),
        ...invoice.items.map((item, i) =>
          React.createElement(
            View,
            { key: String(i), style: styles.tableRow },
            React.createElement(View, { style: styles.colDesc }, React.createElement(Text, { style: styles.cellText }, item.description)),
            React.createElement(View, { style: styles.colQty }, React.createElement(Text, { style: styles.cellText }, String(item.quantity))),
            React.createElement(View, { style: styles.colPrice }, React.createElement(Text, { style: styles.cellText }, formatEGP(item.unitPrice))),
            React.createElement(View, { style: styles.colTotal }, React.createElement(Text, { style: styles.cellTextBold }, formatEGP(item.total))),
          )
        )
      ),
      // Totals
      React.createElement(
        View,
        { style: styles.totalsContainer },
        React.createElement(
          View,
          { style: styles.totalsBox },
          React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, 'Subtotal'),
            React.createElement(Text, { style: styles.totalValue }, formatEGP(invoice.subtotal)),
          ),
          invoice.discount > 0 ? React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, 'Discount'),
            React.createElement(Text, { style: { ...styles.totalValue, color: '#dc2626' } }, `- ${formatEGP(invoice.discount)}`),
          ) : null,
          invoice.tax > 0 ? React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, `Tax (${invoice.tax}%)`),
            React.createElement(Text, { style: styles.totalValue }, formatEGP(taxAmount)),
          ) : null,
          React.createElement(View, { style: styles.grandTotalRow },
            React.createElement(Text, { style: styles.grandTotalLabel }, 'Total'),
            React.createElement(Text, { style: styles.grandTotalValue }, formatEGP(invoice.total)),
          ),
        )
      ),
      // Notes
      invoice.notes ? React.createElement(
        View,
        { style: styles.notes },
        React.createElement(Text, { style: styles.sectionLabel }, 'Notes'),
        React.createElement(Text, { style: styles.notesText }, invoice.notes),
      ) : null,
    )
  ) as ReactElement<DocumentProps>
}
