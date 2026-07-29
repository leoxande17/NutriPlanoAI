// Edge Function: cria uma order (pagamento) no Mercado Pago para uma anamnese
// já respondida pelo usuário autenticado, e grava o registro em `payments`.
//
// Endpoint: POST /functions/v1/mp-create-order
// Body esperado:
// {
//   "anamnesis_id": "uuid",
//   "method": "card" | "pix",
//   "payer_email": "user@example.com",
//   // apenas para method === "card":
//   "card": {
//     "token": "...",              // CardToken gerado pelo MercadoPago.js no frontend
//     "payment_method_id": "master",
//     "payment_type": "credit_card" | "debit_card",
//     "installments": 1,
//     "identification": { "type": "CPF", "number": "12345678900" }
//   }
// }

import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { getAuthenticatedUser, getSupabaseAdmin } from '../_shared/supabase-admin.ts'
import {
  createCardOrder,
  createPixOrder,
  mapOrderStatusToPaymentStatus,
  PLAN_AMOUNT,
} from '../_shared/mercadopago.ts'

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { user, error: authError } = await getAuthenticatedUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: authError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { anamnesis_id, method, payer_email, card } = body

    if (!anamnesis_id || !method || !payer_email) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios ausentes.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (method !== 'card' && method !== 'pix') {
      return new Response(JSON.stringify({ error: 'Método de pagamento inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Garante que a anamnese pertence ao usuário autenticado
    const { data: anamnesis, error: anamnesisError } = await supabaseAdmin
      .from('anamnesis')
      .select('id, user_id')
      .eq('id', anamnesis_id)
      .single()

    if (anamnesisError || !anamnesis || anamnesis.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Anamnese não encontrada.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cria um registro de pagamento pendente antes de chamar o Mercado Pago,
    // usado como external_reference para conciliação.
    const { data: paymentRow, error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        anamnesis_id,
        status: 'pending',
        amount: Number(PLAN_AMOUNT),
      })
      .select('id')
      .single()

    if (insertError || !paymentRow) {
      console.error('Erro ao criar registro de pagamento:', insertError)
      return new Response(JSON.stringify({ error: 'Não foi possível iniciar o pagamento.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const order =
      method === 'card'
        ? await createCardOrder({
            externalReference: paymentRow.id,
            payerEmail: payer_email,
            payerIdentification: card?.identification,
            paymentMethodId: card?.payment_method_id,
            paymentType: card?.payment_type,
            token: card?.token,
            installments: card?.installments ?? 1,
          })
        : await createPixOrder({
            externalReference: paymentRow.id,
            payerEmail: payer_email,
          })

    const status = mapOrderStatusToPaymentStatus(order)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)

    await supabaseAdmin
      .from('payments')
      .update({
        mp_order_id: order.id,
        mp_payment_id: order.transactions?.payments?.[0]?.id ?? null,
        status,
        ...(status === 'approved'
          ? { approved_at: now.toISOString(), expires_at: expiresAt.toISOString() }
          : {}),
      })
      .eq('id', paymentRow.id)

    const payment = order.transactions?.payments?.[0]

    return new Response(
      JSON.stringify({
        payment_id: paymentRow.id,
        status,
        order_id: order.id,
        // Dados do Pix, quando aplicável, para renderizar QR code / copia e cola
        pix:
          method === 'pix'
            ? {
                qr_code: payment?.payment_method?.qr_code,
                qr_code_base64: payment?.payment_method?.qr_code_base64,
                ticket_url: payment?.payment_method?.ticket_url,
              }
            : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Erro inesperado em mp-create-order:', err)
    const message = err instanceof Error ? err.message : 'Erro inesperado ao processar pagamento.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
