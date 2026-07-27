// Validação estrutural mínima do JSON retornado pela IA antes de salvar no banco.
// Módulo isolado (sem dependências de Deno) para ser testável com Vitest/Node.

export interface MealPlanContent {
  summary: {
    dailyCalories: number
    macros: { protein: number; carbs: number; fat: number }
    notes?: string
  }
  meals: {
    name: string
    time: string
    items: { food: string; quantity: string; calories?: number }[]
    totalCalories?: number
  }[]
  recommendations?: string[]
}

export function isValidMealPlanContent(value: unknown): value is MealPlanContent {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>

  if (typeof v.summary !== 'object' || v.summary === null) return false
  const summary = v.summary as Record<string, unknown>
  if (typeof summary.dailyCalories !== 'number') return false
  if (typeof summary.macros !== 'object' || summary.macros === null) return false
  const macros = summary.macros as Record<string, unknown>
  if (
    typeof macros.protein !== 'number' ||
    typeof macros.carbs !== 'number' ||
    typeof macros.fat !== 'number'
  ) {
    return false
  }

  if (!Array.isArray(v.meals) || v.meals.length === 0) return false
  for (const meal of v.meals) {
    if (typeof meal !== 'object' || meal === null) return false
    const m = meal as Record<string, unknown>
    if (typeof m.name !== 'string' || typeof m.time !== 'string') return false
    if (!Array.isArray(m.items) || m.items.length === 0) return false
    for (const item of m.items) {
      if (typeof item !== 'object' || item === null) return false
      const it = item as Record<string, unknown>
      if (typeof it.food !== 'string' || typeof it.quantity !== 'string') return false
    }
  }

  return true
}
