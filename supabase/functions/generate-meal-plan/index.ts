// Edge Function: gera (ou regenera com ajuste) o plano alimentar via Claude API,
// a partir da anamnese vinculada a um pagamento aprovado.
//
// Endpoint: POST /functions/v1/generate-meal-plan
// Body: { "payment_id": "uuid", "adjustment_note"?: "texto do pedido de ajuste" }
//
// Regras:
// - payment.status precisa ser 'approved'
// - payment.expires_at precisa estar no futuro (janela de 15 dias de ajustes)
// - version 1 é a geração inicial; versões seguintes exigem adjustment_note

import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { getAuthenticatedUser, getSupabaseAdmin } from '../_shared/supabase-admin.ts'
import { calculateNutritionTargets } from '../_shared/nutrition.ts'
import { callClaudeForJson } from '../_shared/claude.ts'
import { MEAL_PLAN_SYSTEM_PROMPT, buildMealPlanUserPrompt } from '../_shared/meal-plan-prompt.ts'
import type { AnamnesisForPrompt } from '../_shared/meal-plan-prompt.ts'
import { isValidMealPlanContent } from '../_shared/meal-plan-validator.ts'
import type { MealPlanContent } from '../_shared/meal-plan-validator.ts'

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

    const { payment_id, adjustment_note } = await req.json()
    if (!payment_id) {
      return new Response(JSON.stringify({ error: 'payment_id é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, anamnesis_id, status, expires_at')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment || payment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Pagamento não encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (payment.status !== 'approved') {
      return new Response(JSON.stringify({ error: 'Pagamento ainda não foi aprovado.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'A janela de 15 dias para gerar/ajustar este plano expirou.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: anamnesis, error: anamnesisError } = await supabaseAdmin
      .from('anamnesis')
      .select('*')
      .eq('id', payment.anamnesis_id)
      .single()

    if (anamnesisError || !anamnesis) {
      return new Response(JSON.stringify({ error: 'Anamnese não encontrada.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Busca a versão mais recente (se houver) para saber o próximo número
    // de versão e, em caso de ajuste, dar contexto do plano anterior à IA.
    const { data: existingPlans } = await supabaseAdmin
      .from('meal_plans')
      .select('version, content')
      .eq('payment_id', payment_id)
      .order('version', { ascending: false })
      .limit(1)

    const previousPlan = existingPlans?.[0]
    const nextVersion = (previousPlan?.version ?? 0) + 1

    if (nextVersion > 1 && !adjustment_note) {
      return new Response(
        JSON.stringify({ error: 'Descreva o ajuste desejado para gerar uma nova versão.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targets = calculateNutritionTargets(anamnesis)
    const prompt = buildMealPlanUserPrompt(
      anamnesis as AnamnesisForPrompt,
      targets,
      previousPlan?.content,
      adjustment_note
    )

    const content = await callClaudeForJson<MealPlanContent>(MEAL_PLAN_SYSTEM_PROMPT, prompt)

    if (!isValidMealPlanContent(content)) {
      return new Response(
        JSON.stringify({ error: 'A IA retornou um plano em formato inválido. Tente novamente.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('meal_plans')
      .insert({
        user_id: user.id,
        payment_id,
        anamnesis_id: payment.anamnesis_id,
        version: nextVersion,
        adjustment_note: adjustment_note ?? null,
        content,
      })
      .select('*')
      .single()

    if (insertError || !inserted) {
      console.error('Erro ao salvar plano gerado:', insertError)
      return new Response(JSON.stringify({ error: 'Não foi possível salvar o plano gerado.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ meal_plan: inserted }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro inesperado em generate-meal-plan:', err)
    const message = err instanceof Error ? err.message : 'Erro inesperado ao gerar o plano.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
