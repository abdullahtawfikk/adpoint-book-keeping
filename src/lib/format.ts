// EGP currency formatting — Western numerals
export function formatEGP(amount: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Short format: 1,000 EGP
export function formatEGPShort(amount: number): string {
  return `${new Intl.NumberFormat('en-EG').format(amount)} EGP`
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-EG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}
