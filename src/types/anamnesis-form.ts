import type { ActivityLevel, GoalType } from './database'

// Formato usado internamente pelo wizard (campos numéricos como string
// enquanto o usuário digita, convertidos antes de enviar ao Supabase).
export interface AnamnesisFormData {
  weight_kg: string
  height_cm: string
  age: string
  gender: string

  goal: GoalType | ''
  activity_level: ActivityLevel | ''

  trains: boolean
  training_days_per_week: string
  training_time: string
  training_type: string

  meals_per_day: string
  food_preferences: string
  disliked_foods: string

  allergies: string[]
  dietary_restrictions: string[]
  medical_conditions: string
}

export const initialAnamnesisFormData: AnamnesisFormData = {
  weight_kg: '',
  height_cm: '',
  age: '',
  gender: '',

  goal: '',
  activity_level: '',

  trains: true,
  training_days_per_week: '5',
  training_time: '17:20',
  training_type: '',

  meals_per_day: '5',
  food_preferences: '',
  disliked_foods: '',

  allergies: [],
  dietary_restrictions: [],
  medical_conditions: '',
}
