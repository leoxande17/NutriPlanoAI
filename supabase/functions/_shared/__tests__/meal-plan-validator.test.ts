import { describe, it, expect } from 'vitest'
import { isValidMealPlanContent } from '../meal-plan-validator.ts'

function validPlan() {
  return {
    summary: {
      dailyCalories: 2200,
      macros: { protein: 180, carbs: 220, fat: 60 },
      notes: 'Este plano é educativo.',
    },
    meals: [
      {
        name: 'Café da manhã',
        time: '07:00',
        items: [{ food: 'Ovos mexidos', quantity: '3 unidades', calories: 210 }],
        totalCalories: 210,
      },
    ],
    recommendations: ['Beba bastante água.'],
  }
}

describe('isValidMealPlanContent', () => {
  it('aceita um plano bem formado', () => {
    expect(isValidMealPlanContent(validPlan())).toBe(true)
  })

  it('rejeita null/undefined/tipos primitivos', () => {
    expect(isValidMealPlanContent(null)).toBe(false)
    expect(isValidMealPlanContent(undefined)).toBe(false)
    expect(isValidMealPlanContent('string qualquer')).toBe(false)
    expect(isValidMealPlanContent(42)).toBe(false)
  })

  it('rejeita quando summary está ausente', () => {
    const plan = validPlan() as Record<string, unknown>
    delete plan.summary
    expect(isValidMealPlanContent(plan)).toBe(false)
  })

  it('rejeita quando dailyCalories não é número (ex: IA devolveu string)', () => {
    const plan = validPlan()
    // @ts-expect-error teste de payload malformado intencional
    plan.summary.dailyCalories = '2200 kcal'
    expect(isValidMealPlanContent(plan)).toBe(false)
  })

  it('rejeita quando falta algum macro', () => {
    const plan = validPlan() as { summary: { macros: Record<string, unknown> } }
    delete plan.summary.macros.fat
    expect(isValidMealPlanContent(plan)).toBe(false)
  })

  it('rejeita quando meals está vazio ou ausente', () => {
    expect(isValidMealPlanContent({ ...validPlan(), meals: [] })).toBe(false)
    const plan = validPlan() as Record<string, unknown>
    delete plan.meals
    expect(isValidMealPlanContent(plan)).toBe(false)
  })

  it('rejeita refeição sem items', () => {
    const plan = validPlan()
    plan.meals[0].items = []
    expect(isValidMealPlanContent(plan)).toBe(false)
  })

  it('rejeita item de refeição sem "food" ou "quantity"', () => {
    const plan = validPlan() as { meals: { items: Record<string, unknown>[] }[] }
    delete plan.meals[0].items[0].food
    expect(isValidMealPlanContent(plan)).toBe(false)
  })

  it('aceita mesmo sem "recommendations" (campo opcional)', () => {
    const plan = validPlan() as Record<string, unknown>
    delete plan.recommendations
    expect(isValidMealPlanContent(plan)).toBe(true)
  })
})
