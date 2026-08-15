import type { MealPlan } from '../types/database'

// "Versão 2" não diz nada pra quem não é técnico — troca por algo que
// descreve o que aquele registro realmente é.
export function planVersionLabel(plan: Pick<MealPlan, 'version' | 'created_at'>): string {
  if (plan.version === 1) return 'Plano original'
  return `Ajuste de ${new Date(plan.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })}`
}
