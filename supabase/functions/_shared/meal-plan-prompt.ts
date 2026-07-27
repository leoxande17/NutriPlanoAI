import type { NutritionTargets } from './nutrition.ts'

export interface AnamnesisForPrompt {
  weight_kg: number
  height_cm: number
  age: number
  gender: string
  goal: string
  activity_level: string
  trains: boolean
  training_days_per_week: number | null
  training_time: string | null
  training_type: string | null
  meals_per_day: number
  food_preferences: string | null
  disliked_foods: string | null
  allergies: string[] | null
  dietary_restrictions: string[] | null
  medical_conditions: string | null
}

export const MEAL_PLAN_SYSTEM_PROMPT = `Você é um assistente que apoia a criação de planos alimentares educativos e personalizados, usados em um aplicativo brasileiro chamado NutriPlano AI.

Regras obrigatórias:
- Responda APENAS com um objeto JSON válido, sem nenhum texto antes ou depois, sem markdown, sem comentários.
- Nunca inclua alimentos que estejam na lista de alergias ou que violem as restrições alimentares informadas — isso é uma questão de segurança do usuário.
- Priorize os alimentos que a pessoa disse gostar, evite completamente os que ela disse não gostar.
- A soma aproximada das calorias das refeições deve bater com a meta diária de calorias informada (margem de até 5%).
- Respeite exatamente o número de refeições por dia solicitado.
- Se a pessoa treina, posicione as refeições com mais carboidrato perto do horário de treino (pré/pós-treino).
- Use alimentos comuns e acessíveis no Brasil, com medidas caseiras (ex: "2 fatias", "1 concha média", "150g").
- Este plano é educativo e não substitui acompanhamento profissional de nutricionista — inclua essa observação no campo "notes".

Formato JSON exato de resposta:
{
  "summary": {
    "dailyCalories": number,
    "macros": { "protein": number, "carbs": number, "fat": number },
    "notes": string
  },
  "meals": [
    {
      "name": string,
      "time": string,
      "items": [ { "food": string, "quantity": string, "calories": number } ],
      "totalCalories": number
    }
  ],
  "recommendations": [string]
}`

const GOAL_LABELS: Record<string, string> = {
  emagrecimento: 'Emagrecimento (redução de gordura corporal)',
  hipertrofia: 'Hipertrofia (ganho de massa muscular)',
  recomposicao: 'Recomposição corporal (perder gordura e ganhar músculo)',
  manutencao: 'Manutenção do peso e composição atuais',
}

export function buildMealPlanUserPrompt(
  anamnesis: AnamnesisForPrompt,
  targets: NutritionTargets,
  previousPlan?: unknown,
  adjustmentNote?: string
): string {
  const lines: string[] = []

  lines.push('Dados da pessoa:')
  lines.push(`- Peso: ${anamnesis.weight_kg}kg | Altura: ${anamnesis.height_cm}cm | Idade: ${anamnesis.age} anos | Sexo: ${anamnesis.gender}`)
  lines.push(`- Objetivo: ${GOAL_LABELS[anamnesis.goal] ?? anamnesis.goal}`)
  lines.push(`- Nível de atividade: ${anamnesis.activity_level}`)

  if (anamnesis.trains) {
    lines.push(
      `- Treina ${anamnesis.training_days_per_week ?? '?'}x/semana, tipo: ${anamnesis.training_type ?? 'não informado'}, horário habitual: ${anamnesis.training_time ?? 'não informado'}`
    )
  } else {
    lines.push('- Não treina atualmente')
  }

  lines.push(`- Número de refeições por dia (obrigatório respeitar): ${anamnesis.meals_per_day}`)

  if (anamnesis.food_preferences) lines.push(`- Alimentos que gosta: ${anamnesis.food_preferences}`)
  if (anamnesis.disliked_foods) lines.push(`- Alimentos que NÃO quer no plano: ${anamnesis.disliked_foods}`)
  if (anamnesis.allergies?.length) lines.push(`- ALERGIAS (nunca incluir): ${anamnesis.allergies.join(', ')}`)
  if (anamnesis.dietary_restrictions?.length)
    lines.push(`- Restrições alimentares: ${anamnesis.dietary_restrictions.join(', ')}`)
  if (anamnesis.medical_conditions) lines.push(`- Condições de saúde relevantes: ${anamnesis.medical_conditions}`)

  lines.push('')
  lines.push('Metas nutricionais diárias já calculadas (respeitar rigorosamente):')
  lines.push(`- Calorias: ${targets.dailyCalories} kcal`)
  lines.push(`- Proteína: ${targets.proteinG}g`)
  lines.push(`- Carboidratos: ${targets.carbsG}g`)
  lines.push(`- Gordura: ${targets.fatG}g`)

  if (previousPlan && adjustmentNote) {
    lines.push('')
    lines.push('Plano anterior gerado (para referência):')
    lines.push(JSON.stringify(previousPlan))
    lines.push('')
    lines.push(`Ajuste solicitado pela pessoa: "${adjustmentNote}"`)
    lines.push('Gere uma nova versão do plano incorporando esse ajuste, mantendo as metas nutricionais.')
  }

  lines.push('')
  lines.push('Gere o plano alimentar completo agora, respondendo apenas com o JSON no formato especificado.')

  return lines.join('\n')
}
