import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { MacroRing } from '../../components/ui/MacroRing'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { extractErrorMessage } from '../../lib/extractErrorMessage'
import type { PaymentStatus } from '../../types/database'

const PLAN_PRICE_LABEL = 'R$ 29,90'

type Tab = 'card' | 'pix'

interface CreateOrderResponse {
  payment_id: string
  status: PaymentStatus
  order_id: string
  pix?: {
    qr_code?: string
    qr_code_base64?: string
    ticket_url?: string
  }
}

export function PaymentPage() {
  const { anamnesisId } = useParams<{ anamnesisId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('card')
  const [cardReady, setCardReady] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const brickControllerRef = useRef<{ unmount: () => void } | null>(null)

  const [pixLoading, setPixLoading] = useState(false)
  const [pixError, setPixError] = useState<string | null>(null)
  const [pixData, setPixData] = useState<CreateOrderResponse['pix'] | null>(null)
  const [pixEmail, setPixEmail] = useState('')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)

  // Monta o Card Payment Brick uma única vez (não remonta ao trocar de aba,
  // para não perder os dados já digitados pelo usuário)
  useEffect(() => {
    if (!anamnesisId || !user) return

    let cancelled = false

    async function mountBrick() {
      if (!window.MercadoPago) {
        setCardError('Não foi possível carregar o SDK do Mercado Pago.')
        return
      }
      const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY
      const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' })

      try {
        const controller = await mp.bricks().create('cardPayment', 'cardPaymentBrick_container', {
          initialization: { amount: 29.9 },
          callbacks: {
            onReady: () => {
              if (!cancelled) setCardReady(true)
            },
            onSubmit: async (formData, additionalData) => {
              setCardError(null)
              const { data: sessionData } = await supabase.auth.getSession()
              const accessToken = sessionData.session?.access_token

              const { data, error } = await supabase.functions.invoke<CreateOrderResponse>(
                'mp-create-order',
                {
                  body: {
                    anamnesis_id: anamnesisId,
                    method: 'card',
                    payer_email: formData.payer.email,
                    card: {
                      token: formData.token,
                      payment_method_id: formData.payment_method_id,
                      payment_type: additionalData.paymentTypeId,
                      installments: formData.installments,
                      identification: formData.payer.identification,
                    },
                  },
                  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                }
              )

              if (error || !data) {
                setCardError(
                  await extractErrorMessage(error, 'Não foi possível processar o pagamento. Tente novamente.')
                )
                return
              }

              if (data.status === 'approved') {
                setPaymentId(data.payment_id)
                setApproved(true)
              } else {
                setCardError('Pagamento não aprovado. Verifique os dados do cartão ou tente outro cartão.')
              }
            },
            onError: (err) => {
              console.error(err)
              setCardError('Erro ao processar os dados do cartão.')
            },
          },
        })
        if (!cancelled) brickControllerRef.current = controller
      } catch (err) {
        console.error(err)
        setCardError('Não foi possível carregar o formulário de pagamento.')
      }
    }

    mountBrick()

    return () => {
      cancelled = true
      brickControllerRef.current?.unmount()
      brickControllerRef.current = null
      setCardReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anamnesisId, user])

  // Faz polling do status do pagamento enquanto aguarda confirmação do Pix
  useEffect(() => {
    if (!paymentId || approved) return

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('payments')
        .select('status')
        .eq('id', paymentId)
        .single()

      if (data?.status === 'approved') {
        setApproved(true)
        clearInterval(interval)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [paymentId, approved])

  async function handleGeneratePix() {
    if (!anamnesisId || !user || !pixEmail.trim()) return
    setPixLoading(true)
    setPixError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    const { data, error } = await supabase.functions.invoke<CreateOrderResponse>(
      'mp-create-order',
      {
        body: { anamnesis_id: anamnesisId, method: 'pix', payer_email: pixEmail.trim() },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      }
    )

    setPixLoading(false)

    if (error || !data) {
      setPixError(await extractErrorMessage(error, 'Não foi possível gerar o Pix. Tente novamente.'))
      return
    }

    setPaymentId(data.payment_id)
    setPixData(data.pix ?? null)
    if (data.status === 'approved') setApproved(true)
  }

  if (approved) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 p-6 text-center">
        <MacroRing size={160} />
        <div>
          <p className="font-mono-data text-xs uppercase tracking-widest text-coral mb-2">
            Pagamento aprovado
          </p>
          <h1 className="font-display text-3xl text-ink mb-2">Seu plano está sendo gerado!</h1>
          <p className="text-ink-soft max-w-sm">
            Você tem 15 dias para pedir ajustes e regenerações do seu plano sem custo adicional.
          </p>
        </div>
        <Button onClick={() => navigate(`/plano/${paymentId}`)}>Ver meu plano</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="font-display text-xl text-primary">NutriPlano AI</span>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-6 sm:p-8">
          <p className="font-mono-data text-xs uppercase tracking-widest text-coral mb-2">
            Pagamento único
          </p>
          <h1 className="font-display text-2xl text-ink mb-1">Libere seu plano personalizado</h1>
          <p className="text-ink-soft text-sm mb-6">
            {PLAN_PRICE_LABEL} · inclui ajustes e regenerações por 15 dias
          </p>

          <div className="flex rounded-lg border border-line p-1 mb-6">
            <button
              type="button"
              onClick={() => setTab('card')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === 'card' ? 'bg-primary text-white' : 'text-ink-soft'
              }`}
            >
              Cartão
            </button>
            <button
              type="button"
              onClick={() => setTab('pix')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === 'pix' ? 'bg-primary text-white' : 'text-ink-soft'
              }`}
            >
              Pix
            </button>
          </div>

          <div className={tab === 'card' ? '' : 'hidden'}>
            {!cardReady && !cardError && (
              <p className="text-sm text-ink-soft text-center py-6">
                Carregando formulário de pagamento...
              </p>
            )}
            <div id="cardPaymentBrick_container" />
            {cardError && (
              <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-3 mt-4">
                {cardError}
              </p>
            )}
          </div>

          <div className={`flex flex-col items-center gap-4 w-full ${tab === 'pix' ? '' : 'hidden'}`}>
            {!pixData && (
              <>
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={pixEmail}
                  onChange={(e) => setPixEmail(e.target.value)}
                  className="w-full"
                />
                <Button
                  onClick={handleGeneratePix}
                  loading={pixLoading}
                  disabled={!pixEmail.trim()}
                  className="w-full"
                >
                  Gerar Pix
                </Button>
              </>
            )}

            {pixData?.qr_code_base64 && (
              <>
                <img
                  src={`data:image/jpeg;base64,${pixData.qr_code_base64}`}
                  alt="QR Code do Pix"
                  className="w-48 h-48 rounded-lg border border-line"
                />
                <p className="text-xs text-ink-soft text-center">
                  Escaneie o QR Code com o app do seu banco ou copie o código abaixo.
                </p>
                {pixData.qr_code && (
                  <input
                    readOnly
                    value={pixData.qr_code}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink-soft font-mono-data"
                  />
                )}
                <p className="text-xs text-ink-soft">
                  Aguardando confirmação do pagamento...
                </p>
              </>
            )}

            {pixError && (
              <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-3">
                {pixError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
