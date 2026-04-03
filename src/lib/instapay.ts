export const INSTAPAY_BASE_URL = 'https://ipn.eg/S/adammalakk/instapay/42VKub'

export function getInstaPayURL(amount: number): string {
  return `${INSTAPAY_BASE_URL}?amount=${amount}`
}
