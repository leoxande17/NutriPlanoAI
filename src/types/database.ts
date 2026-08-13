// Tipos manuais espelhando supabase/migrations/0001_init.sql
// (podem ser substituídos depois por `supabase gen types typescript`)

export type GoalType =
  | 'emagrecimento'
  | 'hipertrofia'
  | 'recomposicao'
  | 'manutencao'

export type ActivityLevel =
  | 'sedentario'
  | 'leve'
  | 'moderado'
  | 'intenso'
  | 'atleta'

export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'expired'

export type Profile = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  created_at: string
  updated_at: string
}

export type Anamnesis = {
  id: string
  user_id: string
  weight_kg: number
  height_cm: number
  age: number
  gender: string
  goal: GoalType
  activity_level: ActivityLevel
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
  created_at: string
  updated_at: string
}

export type Payment = {
  id: string
  user_id: string
  anamnesis_id: string
  mp_order_id: string | null
  mp_payment_id: string | null
  mp_preference_id: string | null
  status: PaymentStatus
  amount: number
  approved_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type MealPlanMeal = {
  name: string          // ex: "Café da manhã"
  time: string           // ex: "07:00"
  items: {
    food: string
    quantity: string
    calories?: number
  }[]
  totalCalories?: number
}

export type MealPlanContent = {
  summary: {
    dailyCalories: number
    macros: { protein: number; carbs: number; fat: number }
    notes?: string
  }
  meals: MealPlanMeal[]
  recommendations?: string[]
}

export type MealPlan = {
  id: string
  user_id: string
  payment_id: string
  anamnesis_id: string
  version: number
  adjustment_note: string | null
  content: MealPlanContent
  pdf_path: string | null
  created_at: string
}

export type ProgressEntry = {
  id: string
  user_id: string
  recorded_at: string
  weight_kg: number
  waist_cm: number | null
  hip_cm: number | null
  chest_cm: number | null
  arm_cm: number | null
  thigh_cm: number | null
  body_fat_pct: number | null
  notes: string | null
  created_at: string
}

// Estrutura mínima para o client tipado do supabase-js
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; email: string }
        Update: Partial<Profile>
        Relationships: []
      }
      anamnesis: {
        Row: Anamnesis
        Insert: Omit<Anamnesis, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Anamnesis, 'id' | 'user_id'>>
        Relationships: []
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Payment, 'id' | 'user_id'>>
        Relationships: []
      }
      meal_plans: {
        Row: MealPlan
        Insert: Omit<MealPlan, 'id' | 'created_at'>
        Update: Partial<Omit<MealPlan, 'id' | 'user_id'>>
        Relationships: []
      }
      progress_entries: {
        Row: ProgressEntry
        Insert: Omit<ProgressEntry, 'id' | 'created_at'>
        Update: Partial<Omit<ProgressEntry, 'id' | 'user_id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      goal_type: GoalType
      activity_level: ActivityLevel
      payment_status: PaymentStatus
    }
    CompositeTypes: Record<string, never>
  }
}
