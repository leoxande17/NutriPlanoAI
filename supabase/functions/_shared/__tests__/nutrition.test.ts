import { describe, it, expect } from 'vitest'
import { calculateNutritionTargets } from '../nutrition.ts'

describe('calculateNutritionTargets', () => {
  it('calcula déficit calórico para emagrecimento (homem)', () => {
    const result = calculateNutritionTargets({
      weight_kg: 80,
      height_cm: 178,
      age: 30,
      gender: 'masculino',
      goal: 'emagrecimento',
      activity_level: 'moderado',
    })

    // BMR = 10*80 + 6.25*178 - 5*30 + 5 = 800 + 1112.5 - 150 + 5 = 1767.5
    expect(result.bmr).toBe(1768)
    // TDEE = 1767.5 * 1.55 ≈ 2739.6
    expect(result.tdee).toBeCloseTo(2740, -1)
    // dailyCalories = TDEE * 0.8 (déficit de emagrecimento)
    expect(result.dailyCalories).toBeLessThan(result.tdee)
    expect(result.dailyCalories).toBeCloseTo(result.tdee * 0.8, -1)
  })

  it('calcula superávit calórico para hipertrofia (mulher)', () => {
    const result = calculateNutritionTargets({
      weight_kg: 60,
      height_cm: 165,
      age: 25,
      gender: 'feminino',
      goal: 'hipertrofia',
      activity_level: 'intenso',
    })

    expect(result.dailyCalories).toBeGreaterThan(result.tdee)
    // Hipertrofia usa 1.8g de proteína por kg
    expect(result.proteinG).toBe(Math.round(60 * 1.8))
  })

  it('usa a média das fórmulas quando o gênero é "outro"', () => {
    const male = calculateNutritionTargets({
      weight_kg: 70,
      height_cm: 170,
      age: 28,
      gender: 'masculino',
      goal: 'manutencao',
      activity_level: 'leve',
    })
    const female = calculateNutritionTargets({
      weight_kg: 70,
      height_cm: 170,
      age: 28,
      gender: 'feminino',
      goal: 'manutencao',
      activity_level: 'leve',
    })
    const other = calculateNutritionTargets({
      weight_kg: 70,
      height_cm: 170,
      age: 28,
      gender: 'outro',
      goal: 'manutencao',
      activity_level: 'leve',
    })

    expect(other.bmr).toBe(Math.round((male.bmr + female.bmr) / 2))
  })

  it('nunca deixa os carboidratos ficarem negativos em déficits agressivos', () => {
    const result = calculateNutritionTargets({
      weight_kg: 150,
      height_cm: 160,
      age: 50,
      gender: 'feminino',
      goal: 'emagrecimento',
      activity_level: 'sedentario',
    })

    expect(result.carbsG).toBeGreaterThan(0)
  })

  it('fallback para nível de atividade desconhecido usa o multiplicador sedentário', () => {
    const known = calculateNutritionTargets({
      weight_kg: 70,
      height_cm: 175,
      age: 30,
      gender: 'masculino',
      goal: 'manutencao',
      activity_level: 'sedentario',
    })
    const unknown = calculateNutritionTargets({
      weight_kg: 70,
      height_cm: 175,
      age: 30,
      gender: 'masculino',
      goal: 'manutencao',
      activity_level: 'nivel_inexistente',
    })

    expect(unknown.tdee).toBe(known.tdee)
  })
})
