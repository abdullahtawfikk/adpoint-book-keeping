import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { formatEGP } from '@/lib/format'
import React from 'react'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 48, color: '#0f172a', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#e2e8f0' },
  logo: { width: 32, height: 32, backgroundColor: '#0f172a', borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  logoText: { color: '#ffffff', fontSize: 10, fontFamily: 'Helvetica-Bold' },
  companyName: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  companyDetail: { fontSize: 8, color: '#64748b', marginTop: 2 },
  reportTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  reportSub: { fontSize: 9, color: '#64748b', textAlign: 'right', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  rowBorder: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  label: { fontSize: 9, color: '#475569' },
  value: { fontSize: 9, color: '#0f172a', fontFamily: 'Helvetica-Bold' },
  valueGreen: { fontSize: 9, color: '#059669', fontFamily: 'Helvetica-Bold' },
  valueRed: { fontSize: 9, color: '#dc2626', fontFamily: 'Helvetica-Bold' },
  summaryBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, marginTop: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  summaryValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6, marginTop: 1 },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  catLabel: { fontSize: 9, color: '#475569', flex: 1 },
  catValue: { fontSize: 9, color: '#0f172a', fontFamily: 'Helvetica-Bold' },
})

const CATEGORY_COLORS: Record<string, string> = {
  SOFTWARE: '#6366f1', MARKETING: '#f59e0b', SALARIES: '#10b981',
  RENT: '#3b82f6', EQUIPMENT: '#8b5cf6', TRAVEL: '#ec4899',
  UTILITIES: '#14b8a6', TAXES: '#f97316', OTHER: '#94a3b8',
}

interface ReportData {
  revenue: number
  expenses: number
  expensesByCategory: { category: string; total: number }[]
  dateFrom: string
  dateTo: string
}

export function buildReportDocument(data: ReportData): ReactElement<DocumentProps> {
  const netProfit = data.revenue - data.expenses
  const margin = data.revenue > 0 ? (netProfit / data.revenue) * 100 : 0

  return React.createElement(
    Document,
    null,
    React.createElement(Page, { size: 'A4', style: s.page },
      // Header
      React.createElement(View, { style: s.header },
        React.createElement(View, null,
          React.createElement(View, { style: s.logo }, React.createElement(Text, { style: s.logoText }, 'AP')),
          React.createElement(Text, { style: s.companyName }, 'AdPoint'),
          React.createElement(Text, { style: s.companyDetail }, 'Cairo, Egypt'),
          React.createElement(Text, { style: s.companyDetail }, 'advntgepoint@gmail.com'),
        ),
        React.createElement(View, null,
          React.createElement(Text, { style: s.reportTitle }, 'P&L Report'),
          React.createElement(Text, { style: s.reportSub }, `${data.dateFrom}  →  ${data.dateTo}`),
        )
      ),
      // Revenue
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, 'Revenue'),
        React.createElement(View, { style: s.row },
          React.createElement(Text, { style: s.label }, 'Total Revenue (Paid Invoices)'),
          React.createElement(Text, { style: s.valueGreen }, formatEGP(data.revenue)),
        )
      ),
      // Expenses
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, 'Expenses by Category'),
        ...data.expensesByCategory.map(({ category, total }) =>
          React.createElement(View, { key: category, style: s.catRow },
            React.createElement(View, { style: { ...s.dot, backgroundColor: CATEGORY_COLORS[category] ?? '#94a3b8' } }),
            React.createElement(Text, { style: s.catLabel }, category.charAt(0) + category.slice(1).toLowerCase()),
            React.createElement(Text, { style: s.catValue }, formatEGP(total)),
          )
        ),
        React.createElement(View, { style: { ...s.row, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 6, paddingTop: 8 } },
          React.createElement(Text, { style: { ...s.label, fontFamily: 'Helvetica-Bold', color: '#0f172a' } }, 'Total Expenses'),
          React.createElement(Text, { style: s.valueRed }, formatEGP(data.expenses)),
        )
      ),
      // Summary
      React.createElement(View, { style: s.summaryBox },
        React.createElement(View, { style: s.summaryRow },
          React.createElement(Text, { style: s.summaryLabel }, 'Net Profit'),
          React.createElement(Text, { style: { ...s.summaryValue, color: netProfit >= 0 ? '#059669' : '#dc2626' } }, formatEGP(netProfit)),
        ),
        React.createElement(View, { style: { ...s.summaryRow, marginTop: 6 } },
          React.createElement(Text, { style: { fontSize: 9, color: '#64748b' } }, 'Profit Margin'),
          React.createElement(Text, { style: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: margin >= 0 ? '#059669' : '#dc2626' } }, `${margin.toFixed(1)}%`),
        ),
      ),
      // Footer
      React.createElement(View, { style: { marginTop: 40, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' } },
        React.createElement(Text, { style: { fontSize: 8, color: '#94a3b8', textAlign: 'center' } },
          `Generated by AdPoint Books · ${new Date().toLocaleDateString('en-EG')}`
        )
      )
    )
  ) as ReactElement<DocumentProps>
}
