import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { MacroRing } from '../../components/ui/MacroRing'
import { useAuth } from '../../contexts/AuthContext'
import { generateMealPlanPdf } from '../../lib/generateMealPlanPdf'
import { extractErrorMessage } from '../../lib/extractErrorMessage'
import { AppHeader } from '../../components/layout/AppHeader'
import { planVersionLabel } from '../../lib/planVersionLabel'
import type { MealPlan } from '../../types/database'

async function invokeGenerate(paymentId: string, adjustmentNote?: string) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  return supabase.functions.invoke<{ meal_plan: MealPlan; error?: string }>('generate-meal-plan', {
    body: { payment_id: paymentId, adjustment_note: adjustmentNote },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  })
}

export function PlanPage() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedVersion = searchParams.get('versao') ? Number(searchParams.get('versao')) : null
  const navigate = useNavigate()
  const { user } = useAuth()

  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [latestVersion, setLatestVersion] = useState<number | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // "generating" cobre apenas a geração inicial (tela cheia, ainda não há
  // nada pra mostrar). "adjusting" cobre o pedido de ajuste sobre um plano
  // já visível — não deve esconder a tela inteira, só o botão/formulário.
  const [generating, setGenerating] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showAdjustForm, setShowAdjustForm] = useState(false)
  const [adjustmentNote, setAdjustmentNote] = useState('')

  const loadOrGenerate = useCallback(async () => {
    if (!paymentId) return
    setLoading(true)
    setError(null)

    const { data: payment } = await supabase
      .from('payments')
      .select('expires_at')
      .eq('id', paymentId)
      .single()
    setExpiresAt(payment?.expires_at ?? null)

    // Descobre sempre qual é a versão mais recente, mesmo quando o usuário
    // pediu pra ver uma versão específica — usamos isso pra mostrar o aviso
    // de "você está vendo uma versão antiga".
    const { data: latest } = await supabase
      .from('meal_plans')
      .select('version')
      .eq('payment_id', paymentId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    setLatestVersion(latest?.version ?? null)

    if (requestedVersion) {
      const { data: specific } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('payment_id', paymentId)
        .eq('version', requestedVersion)
        .maybeSingle()

      setLoading(false)
      if (!specific) {
        setError('Essa versão do plano não foi encontrada.')
        return
      }
      setPlan(specific)
      return
    }

    if (latest) {
      const { data: existing } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('payment_id', paymentId)
        .eq('version', latest.version)
        .maybeSingle()
      setPlan(existing ?? null)
      setLoading(false)
      return
    }

    // Nenhum plano ainda: gera a primeira versão automaticamente
    setGenerating(true)
    const { data, error: fnError } = await invokeGenerate(paymentId)
    setGenerating(false)
    setLoading(false)

    if (fnError || !data?.meal_plan) {
      setError(
        await extractErrorMessage(fnError, 'Não foi possível gerar seu plano agora. Tente novamente em instantes.')
      )
      return
    }
    setPlan(data.meal_plan)
    setLatestVersion(data.meal_plan.version)
  }, [paymentId, requestedVersion])

  useEffect(() => {
    loadOrGenerate()
  }, [loadOrGenerate])

  async function handleRequestAdjustment() {
    if (!paymentId || !adjustmentNote.trim()) return
    setAdjusting(true)
    setError(null)

    const { data, error: fnError } = await invokeGenerate(paymentId, adjustmentNote.trim())
    setAdjusting(false)

    if (fnError || !data?.meal_plan) {
      setError(await extractErrorMessage(fnError, 'Não foi possível gerar o ajuste. Tente novamente.'))
      return
    }
    setPlan(data.meal_plan)
    setLatestVersion(data.meal_plan.version)
    setShowAdjustForm(false)
    setAdjustmentNote('')
  }

  const canAdjust = expiresAt ? new Date(expiresAt) > new Date() : false
  const isViewingOldVersion = !!plan && !!latestVersion && plan.version !== latestVersion

  function handleDownloadPdf() {
    if (!plan) return
    generateMealPlanPdf(plan, user?.user_metadata?.full_name)
  }

  function goToLatestVersion() {
    setSearchParams({}, { replace: true })
  }

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 p-6 text-center">
        <MacroRing size={140} />
        <p className="text-ink-soft">
          {generating ? 'Montando seu plano com a IA, isso leva alguns segundos...' : 'Carregando...'}
        </p>
      </div>
    )
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 p-6 text-center">
        <p className="text-danger max-w-sm">{error}</p>
        <Button onClick={loadOrGenerate}>Tentar novamente</Button>
      </div>
    )
  }

  if (!plan) return null

  const { summary, meals, recommendations } = plan.content
  const totalMacroCal = summary.macros.protein * 4 + summary.macros.carbs * 4 + summary.macros.fat * 9
  const proteinPct = totalMacroCal ? Math.round(((summary.macros.protein * 4) / totalMacroCal) * 100) : 0
  const carbsPct = totalMacroCal ? Math.round(((summary.macros.carbs * 4) / totalMacroCal) * 100) : 0
  const fatPct = totalMacroCal ? 100 - proteinPct - carbsPct : 0

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <div className="px-4 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto">
        {isViewingOldVersion && (
          <div className="bg-mango/20 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-ink">
              Você está vendo uma versão anterior do seu plano.
            </p>
            <Button variant="ghost" onClick={goToLatestVersion}>
              Ver versão mais recente
            </Button>
          </div>
        )}

        <div className="bg-surface rounded-2xl border border-line p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <MacroRing protein={proteinPct} carbs={carbsPct} fat={fatPct} size={160} />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-mono-data text-xs uppercase tracking-widest text-coral mb-1">
                {planVersionLabel(plan)}
              </p>
              <h1 className="font-display text-2xl text-ink mb-2">
                {summary.dailyCalories} kcal por dia
              </h1>
              <div className="flex gap-4 justify-center sm:justify-start text-sm font-mono-data text-ink-soft">
                <span><span className="text-primary font-medium">{summary.macros.protein}g</span> proteína</span>
                <span><span className="text-mango-text font-medium">{summary.macros.carbs}g</span> carbo</span>
                <span><span className="text-coral font-medium">{summary.macros.fat}g</span> gordura</span>
              </div>
            </div>
          </div>
          {summary.notes && (
            <p className="text-sm text-ink-soft mt-4 pt-4 border-t border-line">{summary.notes}</p>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <Button variant="secondary" onClick={handleDownloadPdf}>
            Baixar plano em PDF
          </Button>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {meals.map((meal, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-line p-6">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="font-display text-lg text-ink">{meal.name}</h2>
                <span className="font-mono-data text-xs text-ink-soft">{meal.time}</span>
              </div>
              <ul className="flex flex-col gap-2">
                {meal.items.map((item, j) => (
                  <li key={j} className="flex justify-between text-sm">
                    <span className="text-ink">{item.food}</span>
                    <span className="text-ink-soft font-mono-data">{item.quantity}</span>
                  </li>
                ))}
              </ul>
              {meal.totalCalories && (
                <p className="text-xs text-ink-soft font-mono-data mt-3 pt-3 border-t border-line">
                  {meal.totalCalories} kcal
                </p>
              )}
            </div>
          ))}
        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="bg-primary-soft rounded-2xl p-6 mb-6">
            <h2 className="font-display text-lg text-primary-dark mb-3">Recomendações</h2>
            <ul className="flex flex-col gap-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-primary-dark flex gap-2">
                  <span>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-surface rounded-2xl border border-line p-6">
          {isViewingOldVersion ? (
            <p className="text-sm text-ink-soft">
              Ajustes só podem ser pedidos a partir da versão mais recente do plano.
            </p>
          ) : canAdjust ? (
            <>
              <p className="text-sm text-ink-soft mb-3">
                Você pode pedir ajustes no seu plano até{' '}
                {expiresAt && new Date(expiresAt).toLocaleDateString('pt-BR')}.
              </p>
              {!showAdjustForm ? (
                <Button variant="ghost" onClick={() => setShowAdjustForm(true)}>
                  Pedir ajuste no plano
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Textarea
                    label="O que você gostaria de ajustar?"
                    placeholder="Ex: trocar o frango por peixe, reduzir uma refeição, mais opções vegetarianas..."
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                  />
                  {error && <p className="text-sm text-danger">{error}</p>}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRequestAdjustment}
                      loading={adjusting}
                      disabled={!adjustmentNote.trim()}
                    >
                      Gerar novo plano
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAdjustForm(false)} disabled={adjusting}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-soft">
              A janela de ajustes gratuitos deste plano já encerrou.
            </p>
          )}
        </div>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate('/central')}>
            Ver histórico completo
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}
