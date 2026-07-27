// Edge Function: recebe as notificações Webhook do Mercado Pago (tópico "order")
// e atualiza o status do pagamento correspondente em `payments`.
//
// Configurar em: Suas integrações > Webhooks > Configurar notificações
// URL: https://SEU-PROJETO.supabase.co/functions/v1/mp-webhook
// Evento: Order (Mercado Pago)
//
// Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/notifications

import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts'
import { getOrder, mapOrderStatusToPaymentStatus } from '../_shared/mercadopago.ts'
import { isValidSignature } from '../_shared/webhook-signature.ts'

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const dataId = url.searchParams.get('data.id')
    const topic = url.searchParams.get('type')

    const body = await req.json().catch(() => ({}))
    const orderId = dataId ?? body?.data?.id

    if (!orderId) {
      // Nada para processar, mas confirmamos recebimento para não gerar reenvios.
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET')
    if (webhookSecret) {
      const valid = await isValidSignature(
        req.headers.get('x-signature'),
        req.headers.get('x-request-id'),
        orderId,
        webhookSecret
      )
      if (!valid) {
        console.error('Assinatura de webhook inválida.')
        return new Response(JSON.stringify({ error: 'Assinatura inválida.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Só nos interessa o tópico "order"; outros tipos são confirmados e ignorados.
    if (topic && topic !== 'order' && body?.type && body.type !== 'order') {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    const order = await getOrder(orderId)
    const status = mapOrderStatusToPaymentStatus(order)
    const supabaseAdmin = getSupabaseAdmin()

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)

    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id, status, approved_at')
      .eq('mp_order_id', order.id)
      .single()

    if (!existing) {
      console.error('Pagamento não encontrado para a order:', order.id)
      // Ainda respondemos 200 para o Mercado Pago não ficar reenviando indefinidamente.
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    await supabaseAdmin
      .from('payments')
      .update({
        status,
        mp_payment_id: order.transactions?.payments?.[0]?.id ?? null,
        ...(status === 'approved' && !existing.approved_at
          ? { approved_at: now.toISOString(), expires_at: expiresAt.toISOString() }
          : {}),
      })
      .eq('id', existing.id)

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('Erro inesperado em mp-webhook:', err)
    // Retornamos 200 mesmo em erro interno para evitar reenvios excessivos;
    // o erro fica registrado nos logs da function para investigação.
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
})
