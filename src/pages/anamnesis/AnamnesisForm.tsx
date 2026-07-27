import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepProgress } from '../../components/ui/StepProgress'
import { Button } from '../../components/ui/Button'
import { MacroRing } from '../../components/ui/MacroRing'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  initialAnamnesisFormData,
  type AnamnesisFormData,
} from '../../types/anamnesis-form'
import type { GoalType, ActivityLevel } from '../../types/database'
import { BodyDataStep } from './steps/BodyDataStep'
import { GoalStep } from './steps/GoalStep'
import { TrainingStep } from './steps/TrainingStep'
import { MealsStep } from './steps/MealsStep'
import { HealthStep } from './steps/HealthStep'
import { ReviewStep } from './steps/ReviewStep'

const STEP_LABELS = [
  'Seus dados corporais',
  'Seu objetivo',
  'Sua rotina de treino',
  'Suas refeições',
  'Saúde e restrições',
  'Revisão final',
]

type Errors = Partial<Record<keyof AnamnesisFormData, string>>

function validateStep(step: number, data: AnamnesisFormData): Errors {
  const errors: Errors = {}

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

export function AnamnesisForm() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [data, setData] = useState<AnamnesisFormData>(initialAnamnesisFormData)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [insertedId, setInsertedId] = useState<string | null>(null)

  function updateField(field: keyof AnamnesisFormData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function updateArrayField(field: 'allergies' | 'dietary_restrictions', value: string[]) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function toggleTrains(value: boolean) {
    setData((prev) => ({ ...prev, trains: value }))
  }

  function goNext() {
    const stepErrors = validateStep(step, data)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    setSubmitError(null)

    const { data: inserted, error } = await supabase
      .from('anamnesis')
      .insert({
        user_id: user.id,
        weight_kg: Number(data.weight_kg),
        height_cm: Number(data.height_cm),
        age: Number(data.age),
        gender: data.gender,
        goal: data.goal as GoalType,
        activity_level: data.activity_level as ActivityLevel,
        trains: data.trains,
        training_days_per_week: data.trains ? Number(data.training_days_per_week) : null,
        training_time: data.trains ? data.training_time : null,
        training_type: data.trains ? data.training_type : null,
        meals_per_day: Number(data.meals_per_day),
        food_preferences: data.food_preferences || null,
        disliked_foods: data.disliked_foods || null,
        allergies: data.allergies.length > 0 ? data.allergies : null,
        dietary_restrictions: data.dietary_restrictions.length > 0 ? data.dietary_restrictions : null,
        medical_conditions: data.medical_conditions || null,
      })
      .select('id')
      .single()

    setSubmitting(false)

    if (error || !inserted) {
      setSubmitError('Não foi possível salvar sua anamnese. Tente novamente.')
      return
    }
    setInsertedId(inserted.id)
  }

  if (insertedId) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 p-6 text-center">
        <MacroRing size={160} />
        <div>
          <p className="font-mono-data text-xs uppercase tracking-widest text-coral mb-2">
            Anamnese concluída
          </p>
          <h1 className="font-display text-3xl text-ink mb-2">Perfeito, já temos tudo!</h1>
          <p className="text-ink-soft max-w-sm">
            Agora é só liberar a geração do seu plano com o pagamento único.
          </p>
        </div>
        <Button onClick={() => navigate(`/pagamento/${insertedId}`)}>Ir para o pagamento</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <span className="font-display text-xl text-primary">NutriPlano AI</span>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-6 sm:p-8">
          <StepProgress steps={STEP_LABELS} currentStep={step} />

          {step === 0 && <BodyDataStep data={data} errors={errors} onChange={updateField} />}
          {step === 1 && <GoalStep data={data} errors={errors} onChange={updateField} />}
          {step === 2 && (
            <TrainingStep
              data={data}
              errors={errors}
              onChange={updateField}
              onToggleTrains={toggleTrains}
            />
          )}
          {step === 3 && <MealsStep data={data} errors={errors} onChange={updateField} />}
          {step === 4 && (
            <HealthStep
              data={data}
              errors={errors}
              onChange={updateField}
              onChangeArray={updateArrayField}
            />
          )}
          {step === 5 && <ReviewStep data={data} onEditStep={setStep} />}

          {submitError && (
            <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-3 mt-6">
              {submitError}
            </p>
          )}

          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={goBack} disabled={step === 0 || submitting}>
              Voltar
            </Button>

            {step < STEP_LABELS.length - 1 ? (
              <Button onClick={goNext}>Avançar</Button>
            ) : (
              <Button onClick={handleSubmit} loading={submitting}>
                Confirmar e continuar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
