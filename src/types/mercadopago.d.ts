// Declaração mínima para o SDK MercadoPago.js (carregado via <script> em index.html).
// Cobre apenas o que usamos: inicialização e o Card Payment Brick.
export {}

interface MercadoPagoCardPaymentBrickController {
  unmount: () => void
}

interface MercadoPagoBricksBuilder {
  create: (
    brickType: 'cardPayment',
    containerId: string,
    settings: {
      initialization: { amount: number }
      customization?: {
        visual?: {
          style?: { theme?: 'default' | 'dark' | 'bootstrap' | 'flat' }
        }
      }
      callbacks: {
        onReady?: () => void
        onSubmit: (
          formData: {
            transaction_amount: number
            token: string
            payment_method_id: string
            installments: number
            payer: {
              email: string
              identification?: { type: string; number: string }
            }
          },
          additionalData: { paymentTypeId: string }
        ) => Promise<void>
        onError?: (error: unknown) => void
      }
    }
  ) => Promise<MercadoPagoCardPaymentBrickController>
}

interface MercadoPagoInstance {
  bricks: () => MercadoPagoBricksBuilder
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance
  }
}
