// Helper de integração com a API de Orders do Mercado Pago (Checkout Transparente).
// Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/overview

export const PLAN_AMOUNT = '29.90'
const MP_API_BASE = 'https://api.mercadopago.com'

function getAccessToken(): string {
  const token = Deno.env.get('MP_ACCESS_TOKEN')
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurado.')
  return token
}

interface CardOrderInput {
  externalReference: string
  payerEmail: string
  payerIdentification?: { type: string; number: string }
  paymentMethodId: string // bandeira do cartão, ex: "master", "visa"
  paymentType: 'credit_card' | 'debit_card'
  token: string
  installments: number
}

interface PixOrderInput {
  externalReference: string
  payerEmail: string
}

export interface MpOrderPaymentMethod {
  id: string
  type: string
  ticket_url?: string
  qr_code?: string
  qr_code_base64?: string
  token?: string
  installments?: number
}

export interface MpOrderTransactionPayment {
  id: string
  status: string
  status_detail: string
  amount: string
  paid_amount?: string
  payment_method: MpOrderPaymentMethod
}

export interface MpOrder {
  id: string
  type: string
  status: string
  status_detail: string
  total_amount: string
  external_reference: string
  transactions: {
    payments: MpOrderTransactionPayment[]
  }
}

async function callMpApi(body: unknown): Promise<MpOrder> {
  const response = await fetch(`${MP_API_BASE}/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Erro ao criar order no Mercado Pago:', JSON.stringify(data))
    const causeDetail = Array.isArray(data?.cause)
      ? data.cause.map((c: { code?: string; description?: string }) => c.description ?? c.code).join('; ')
      : null
    const message =
      data?.message ||
      data?.error ||
      causeDetail ||
      `HTTP ${response.status}: ${JSON.stringify(data).slice(0, 500)}`
    throw new Error(message)
  }

  return data as MpOrder
}

export function createCardOrder(input: CardOrderInput): Promise<MpOrder> {
  return callMpApi({
    type: 'online',
    processing_mode: 'automatic',
    total_amount: PLAN_AMOUNT,
    external_reference: input.externalReference,
    payer: {
      email: input.payerEmail,
      ...(input.payerIdentification ? { identification: input.payerIdentification } : {}),
    },
    transactions: {
      payments: [
        {
          amount: PLAN_AMOUNT,
          payment_method: {
            id: input.paymentMethodId,
            type: input.paymentType,
            token: input.token,
            installments: input.installments,
          },
        },
      ],
    },
  })
}

export function createPixOrder(input: PixOrderInput): Promise<MpOrder> {
  return callMpApi({
    type: 'online',
    processing_mode: 'automatic',
    total_amount: PLAN_AMOUNT,
    external_reference: input.externalReference,
    payer: {
      email: input.payerEmail,
    },
    transactions: {
      payments: [
        {
          amount: PLAN_AMOUNT,
          payment_method: {
            id: 'pix',
            type: 'bank_transfer',
          },
        },
      ],
    },
  })
}

export async function getOrder(orderId: string): Promise<MpOrder> {
  const response = await fetch(`${MP_API_BASE}/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  const data = await response.json()
  if (!response.ok) {
    console.error('Erro ao consultar order no Mercado Pago:', JSON.stringify(data))
    const causeDetail = Array.isArray(data?.cause)
      ? data.cause.map((c: { code?: string; description?: string }) => c.description ?? c.code).join('; ')
      : null
    const message =
      data?.message ||
      data?.error ||
      causeDetail ||
      `HTTP ${response.status}: ${JSON.stringify(data).slice(0, 500)}`
    throw new Error(message)
  }
  return data as MpOrder
}

// Mapeia o status da order do Mercado Pago para o enum payment_status do banco.
export function mapOrderStatusToPaymentStatus(
  order: MpOrder
): 'pending' | 'approved' | 'rejected' | 'refunded' {
  const payment = order.transactions?.payments?.[0]
  const detail = payment?.status_detail ?? order.status_detail

  if (order.status === 'processed' && detail === 'accredited') return 'approved'
  if (order.status === 'action_required') return 'pending' // ex: Pix aguardando pagamento
  if (order.status === 'refunded' || detail === 'refunded') return 'refunded'
  if (order.status === 'cancelled' || order.status === 'rejected') return 'rejected'
  return 'pending'
}
