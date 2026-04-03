import axios from 'axios'

const BASE = 'https://accept.paymob.com/api'

export async function paymobAuthToken(): Promise<string> {
  const res = await axios.post(`${BASE}/auth/tokens`, {
    api_key: process.env.PAYMOB_API_KEY,
  })
  return res.data.token as string
}

export async function paymobCreateOrder(
  authToken: string,
  amountCents: number,
  merchantOrderId: string
): Promise<number> {
  const res = await axios.post(`${BASE}/ecommerce/orders`, {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: 'EGP',
    merchant_order_id: merchantOrderId,
    items: [],
  })
  return res.data.id as number
}

export async function paymobPaymentKey(
  authToken: string,
  amountCents: number,
  orderId: number,
  billing: { firstName: string; lastName: string; email: string; phone: string }
): Promise<string> {
  const res = await axios.post(`${BASE}/acceptance/payment_keys`, {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: orderId,
    billing_data: {
      first_name: billing.firstName,
      last_name: billing.lastName,
      email: billing.email || 'NA',
      phone_number: billing.phone || 'NA',
      apartment: 'NA',
      floor: 'NA',
      street: 'NA',
      building: 'NA',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'NA',
      country: 'EG',
      state: 'NA',
    },
    currency: 'EGP',
    integration_id: Number(process.env.PAYMOB_INTEGRATION_ID),
    lock_order_when_paid: false,
  })
  return res.data.token as string
}

export function paymobPaymentUrl(paymentToken: string): string {
  return `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`
}

// HMAC verification for webhook
// Paymob concatenates these fields from obj in this exact order
export function verifyPaymobHmac(obj: Record<string, unknown>, receivedHmac: string): boolean {
  const crypto = require('crypto') as typeof import('crypto')
  const secret = process.env.PAYMOB_HMAC_SECRET!

  const order = obj.order as Record<string, unknown>
  const sourceData = obj.source_data as Record<string, unknown>

  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    order?.id,
    obj.owner,
    obj.pending,
    sourceData?.pan,
    sourceData?.sub_type,
    sourceData?.type,
    obj.success,
  ]

  const concatenated = fields.map((v) => String(v ?? '')).join('')
  const computed = crypto.createHmac('sha512', secret).update(concatenated).digest('hex')
  return computed === receivedHmac
}
