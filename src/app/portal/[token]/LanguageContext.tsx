'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

/* ── Types ──────────────────────────────────────────────────── */

type Lang = 'en' | 'ar'

interface Translations {
  clientPortal: string
  outstandingBalance: string
  allSettled: string
  totalInvoiced: string
  totalPaid: string
  invoices: string
  all: string
  unpaid: string
  paid: string
  due: string
  remaining: string
  total: string
  downloadPdf: string
  downloadStatement: string
  paymentSchedule: string
  pending: string
  overdue: string
  received: string
  openInstaPay: string
  approveInvoice: string
  approved: string
  iPaid: string
  messages: string
  sendMessage: string
  messagePlaceholder: string
  send: string
  noInvoices: string
  nothingOutstanding: string
  noPaidInvoices: string
  payAmount: string
  claimSubmitted: string
  claimNote: string
  claimNotePlaceholder: string
  uploadReceipt: string
  submitClaim: string
  submitting: string
  cancel: string
  invoiceApproved: string
  partial: string
  draft: string
  sent: string
  cancelled: string
  phases: string
  phasesOf: string
}

/* ── EN strings ─────────────────────────────────────────────── */

const en: Translations = {
  clientPortal:       'Client Portal',
  outstandingBalance: 'Outstanding Balance',
  allSettled:         'All settled — thank you!',
  totalInvoiced:      'Total Invoiced',
  totalPaid:          'Total Paid',
  invoices:           'Invoices',
  all:                'All',
  unpaid:             'Unpaid',
  paid:               'Paid',
  due:                'Due',
  remaining:          'Remaining',
  total:              'Total',
  downloadPdf:        'Download PDF',
  downloadStatement:  'Download Statement',
  paymentSchedule:    'Payment Schedule',
  pending:            'Pending',
  overdue:            'Overdue',
  received:           'Received',
  openInstaPay:       'Open InstaPay',
  approveInvoice:     'Approve Invoice',
  approved:           'Approved',
  iPaid:              "I've Paid",
  messages:           'Messages',
  sendMessage:        'Send a message',
  messagePlaceholder: 'Write your message…',
  send:               'Send',
  noInvoices:         'No invoices yet.',
  nothingOutstanding: "You're all caught up.",
  noPaidInvoices:     'No paid invoices.',
  payAmount:          'Pay',
  claimSubmitted:     "Claim submitted — we'll confirm once payment is received.",
  claimNote:          'Payment note (optional)',
  claimNotePlaceholder: 'e.g. Sent via InstaPay at 2:15pm',
  uploadReceipt:      'Upload receipt (optional)',
  submitClaim:        'Submit Payment Claim',
  submitting:         'Submitting…',
  cancel:             'Cancel',
  invoiceApproved:    'Invoice approved',
  partial:            'Partial',
  draft:              'Draft',
  sent:               'Sent',
  cancelled:          'Cancelled',
  phases:             'phases paid',
  phasesOf:           'of',
}

/* ── AR strings ─────────────────────────────────────────────── */

const ar: Translations = {
  clientPortal:       'بوابة العميل',
  outstandingBalance: 'الرصيد المستحق',
  allSettled:         'تمت التسوية — شكراً لك!',
  totalInvoiced:      'إجمالي الفواتير',
  totalPaid:          'إجمالي المدفوع',
  invoices:           'الفواتير',
  all:                'الكل',
  unpaid:             'غير مدفوع',
  paid:               'مدفوع',
  due:                'تاريخ الاستحقاق',
  remaining:          'المتبقي',
  total:              'الإجمالي',
  downloadPdf:        'تحميل PDF',
  downloadStatement:  'تحميل كشف الحساب',
  paymentSchedule:    'جدول السداد',
  pending:            'معلق',
  overdue:            'متأخر',
  received:           'تم الاستلام',
  openInstaPay:       'فتح InstaPay',
  approveInvoice:     'اعتماد الفاتورة',
  approved:           'معتمد',
  iPaid:              'لقد دفعت',
  messages:           'الرسائل',
  sendMessage:        'إرسال رسالة',
  messagePlaceholder: 'اكتب رسالتك…',
  send:               'إرسال',
  noInvoices:         'لا توجد فواتير بعد.',
  nothingOutstanding: 'لا يوجد مستحق حالياً.',
  noPaidInvoices:     'لا توجد فواتير مدفوعة.',
  payAmount:          'ادفع',
  claimSubmitted:     'تم إرسال التأكيد — سنتحقق عند استلام الدفع.',
  claimNote:          'ملاحظة الدفع (اختياري)',
  claimNotePlaceholder: 'مثال: أرسلت عبر InstaPay الساعة 2:15 مساءً',
  uploadReceipt:      'رفع الإيصال (اختياري)',
  submitClaim:        'تقديم تأكيد الدفع',
  submitting:         'جارٍ الإرسال…',
  cancel:             'إلغاء',
  invoiceApproved:    'تم اعتماد الفاتورة',
  partial:            'جزئي',
  draft:              'مسودة',
  sent:               'مرسل',
  cancelled:          'ملغي',
  phases:             'مراحل مدفوعة',
  phasesOf:           'من',
}

const STRINGS = { en, ar } as const

/* ── Context ────────────────────────────────────────────────── */

interface LanguageContextValue {
  lang: Lang
  t: Translations
  toggle: () => void
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  t: en,
  toggle: () => {},
  isRTL: false,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const toggle = useCallback(() => setLang(l => l === 'en' ? 'ar' : 'en'), [])

  return (
    <LanguageContext.Provider value={{ lang, t: STRINGS[lang], toggle, isRTL: lang === 'ar' }}>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
