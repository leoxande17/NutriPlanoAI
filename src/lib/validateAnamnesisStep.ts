import type { AnamnesisFormData } from '../types/anamnesis-form'

export type AnamnesisErrors = Partial<Record<keyof AnamnesisFormData, string>>

// Validação de uma etapa específica do wizard de anamnese (usado ao avançar
// de step em step na primeira resposta).
export function validateAnamnesisStep(step: number, data: AnamnesisFormData): AnamnesisErrors {
  const errors: AnamnesisErrors = {}

  if (step === 0) {
    if (!data.weight_kg || Number(data.weight_kg) <= 0) errors.weight_kg = 'Informe um peso válido.'
    if (!data.height_cm || Number(data.height_cm) <= 0) errors.height_cm = 'Informe uma altura válida.'
    if (!data.age || Number(data.age) <= 0) errors.age = 'Informe uma idade válida.'
    if (!data.gender) errors.gender = 'Selecione uma opção.'
  }

  if (step === 1) {
    if (!data.goal) errors.goal = 'Selecione um objetivo.'
    if (!data.activity_level) errors.activity_level = 'Selecione seu nível de atividade.'
  }

  if (step === 2 && data.trains) {
    if (!data.training_days_per_week) errors.training_days_per_week = 'Informe os dias de treino.'
    if (!data.training_time) errors.training_time = 'Informe o horário.'
    if (!data.training_type) errors.training_type = 'Informe o tipo de treino.'
  }

  if (step === 3) {
    if (!data.meals_per_day || Number(data.meals_per_day) < 3) {
      errors.meals_per_day = 'Informe ao menos 3 refeições por dia.'
    }
  }

  return errors
}

// Validação de todos os campos de uma vez (usado na edição em página única,
// onde não há o conceito de "avançar etapa" — precisa validar tudo antes de salvar).
export function validateAllAnamnesisSteps(data: AnamnesisFormData): AnamnesisErrors {
  return [0, 1, 2, 3].reduce<AnamnesisErrors>(
    (acc, step) => ({ ...acc, ...validateAnamnesisStep(step, data) }),
    {}
  )
}
