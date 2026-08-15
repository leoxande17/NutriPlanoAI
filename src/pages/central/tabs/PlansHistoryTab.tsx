import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui/Button'
import { generateMealPlanPdf } from '../../../lib/generateMealPlanPdf'
import { planVersionLabel } from '../../../lib/planVersionLabel'
import type { MealPlan } from '../../../types/database'

export function PlansHistoryTab() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setPlans(data ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return <p className="text-sm text-ink-soft py-8 text-center">Carregando...</p>
  }

  if (plans.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-line p-8 text-center">
        <p className="text-sm text-ink-soft">Nenhum plano gerado ainda.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="bg-surface rounded-2xl border border-line p-5 flex items-center justify-between gap-4"
        >
          <div>
            <p className="font-mono-data text-xs uppercase tracking-widest text-coral mb-1">
              {planVersionLabel(plan)}
            </p>
            <p className="font-display text-base text-ink">
              {plan.content.summary.dailyCalories} kcal/dia
            </p>
            <p className="text-xs text-ink-soft mt-0.5">
              {new Date(plan.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" onClick={() => generateMealPlanPdf(plan, user?.user_metadata?.full_name)}>
              PDF
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/plano/${plan.payment_id}?versao=${plan.version}`)}>
              Ver
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
