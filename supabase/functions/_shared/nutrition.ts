// Cálculo determinístico de metas nutricionais (Mifflin-St Jeor + fatores de
// atividade e objetivo). A IA recebe essas metas prontas e só monta o cardápio
// dentro delas — evita que o modelo "invente" números de calorias/macros.

// Tipo local mínimo (Edge Functions são empacotadas isoladamente e não podem
// importar de src/ do frontend). Mantenha em sincronia com src/types/database.ts.
export interface AnamnesisForNutrition {
  weight_kg: number
  height_cm: number
  age: number
  gender: string
  goal: string
  activity_level: string
}

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  atleta: 1.9,
}

// Fator sobre o TDEE conforme o objetivo
const GOAL_CALORIE_FACTOR: Record<string, number> = {
  emagrecimento: 0.8,
  hipertrofia: 1.1,
  recomposicao: 0.95,
  manutencao: 1.0,
}

// Gramas de proteína por kg de peso corporal, conforme objetivo
const GOAL_PROTEIN_PER_KG: Record<string, number> = {
  emagrecimento: 2.0,
  hipertrofia: 1.8,
  recomposicao: 2.2,
  manutencao: 1.6,
}

export interface NutritionTargets {
  bmr: number
  tdee: number
  dailyCalories: number
  proteinG: number
  fatG: number
  carbsG: number
}

export function calculateNutritionTargets(anamnesis: AnamnesisForNutrition): NutritionTargets {
  const weight = anamnesis.weight_kg
  const height = anamnesis.height_cm
  const age = anamnesis.age

  // Mifflin-St Jeor
  const bmrMale = 10 * weight + 6.25 * height - 5 * age + 5
  const bmrFemale = 10 * weight + 6.25 * height - 5 * age - 161
  const bmr =
    anamnesis.gender === 'masculino' ? bmrMale : anamnesis.gender === 'feminino' ? bmrFemale : (bmrMale + bmrFemale) / 2

  const activityMultiplier = ACTIVITY_MULTIPLIER[anamnesis.activity_level] ?? 1.2
  const tdee = bmr * activityMultiplier

  const goalFactor = GOAL_CALORIE_FACTOR[anamnesis.goal] ?? 1.0
  const dailyCalories = Math.round(tdee * goalFactor)

  const proteinPerKg = GOAL_PROTEIN_PER_KG[anamnesis.goal] ?? 1.6
  const proteinG = Math.round(weight * proteinPerKg)
  const proteinCal = proteinG * 4

  const fatCal = dailyCalories * 0.25
  const fatG = Math.round(fatCal / 9)

  const remainingCal = Math.max(dailyCalories - proteinCal - fatCal, 200) // evita carbo negativo
  const carbsG = Math.round(remainingCal / 4)

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalories,
    proteinG,
    fatG,
    carbsG,
  }
}
