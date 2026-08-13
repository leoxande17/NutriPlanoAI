import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui/Button'
import { BodyDataStep } from '../../anamnesis/steps/BodyDataStep'
import { GoalStep } from '../../anamnesis/steps/GoalStep'
import { TrainingStep } from '../../anamnesis/steps/TrainingStep'
import { MealsStep } from '../../anamnesis/steps/MealsStep'
import { HealthStep } from '../../anamnesis/steps/HealthStep'
import { initialAnamnesisFormData } from '../../../types/anamnesis-form'
import type { AnamnesisFormData } from '../../../types/anamnesis-form'
import type { ActivityLevel, Anamnesis, GoalType } from '../../../types/database'

function anamnesisToFormData(a: Anamnesis): AnamnesisFormData {
  return {
    weight_kg: String(a.weight_kg),
    height_cm: String(a.height_cm),
    age: String(a.age),
    gender: a.gender,
    goal: a.goal,
    activity_level: a.activity_level,
    trains: a.trains,
    training_days_per_week: a.training_days_per_week ? String(a.training_days_per_week) : '5',
    training_time: a.training_time ?? '17:20',
    training_type: a.training_type ?? '',
    meals_per_day: String(a.meals_per_day),
    food_preferences: a.food_preferences ?? '',
    disliked_foods: a.disliked_foods ?? '',
    allergies: a.allergies ?? [],
    dietary_restrictions: a.dietary_restrictions ?? [],
    medical_conditions: a.medical_conditions ?? '',
  }
}

const SECTION_TITLES = [
  'Dados corporais',
  'Objetivo',
  'Rotina de treino',
  'Refeições',
  'Saúde e restrições',
]

type Errors = Partial<Record<keyof AnamnesisFormData, string>>

export function AnamnesisEditTab() {
  const { user } = useAuth()
  const [anamnesisId, setAnamnesisId] = useState<string | null>(null)
  const [data, setData] = useState<AnamnesisFormData>(initialAnamnesisFormData)
  const [errors] = useState<Errors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: row } = await supabase
        .from('anamnesis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (row) {
        setAnamnesisId(row.id)
        setData(anamnesisToFormData(row))
      }
      setLoading(false)
    }
    load()
  }, [user])

  function updateField(field: keyof AnamnesisFormData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function updateArrayField(field: 'allergies' | 'dietary_restrictions', value: string[]) {
    setData((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function toggleTrains(value: boolean) {
    setData((prev) => ({ ...prev, trains: value }))
    setSaved(false)
  }

  async function handleSave() {
    if (!anamnesisId) return
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('anamnesis')
      .update({
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
      .eq('id', anamnesisId)

    setSaving(false)

    if (updateError) {
      setError('Não foi possível salvar as alterações. Tente novamente.')
      return
    }
    setSaved(true)
  }

  if (loading) {
    return <p className="text-sm text-ink-soft py-8 text-center">Carregando...</p>
  }

  if (!anamnesisId) {
    return (
      <div className="bg-surface rounded-2xl border border-line p-8 text-center">
        <p className="text-sm text-ink-soft">Você ainda não respondeu a anamnese.</p>
      </div>
    )
  }

  const steps = [
    <BodyDataStep data={data} errors={errors} onChange={updateField} />,
    <GoalStep data={data} errors={errors} onChange={updateField} />,
    <TrainingStep data={data} errors={errors} onChange={updateField} onToggleTrains={toggleTrains} />,
    <MealsStep data={data} errors={errors} onChange={updateField} />,
    <HealthStep data={data} errors={errors} onChange={updateField} onChangeArray={updateArrayField} />,
  ]

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft -mt-2">
        Editar aqui atualiza as informações usadas para gerar seus próximos planos e ajustes.
      </p>

      {steps.map((StepComponent, i) => (
        <div key={i} className="bg-surface rounded-2xl border border-line p-6">
          <h2 className="font-display text-base text-ink mb-4">{SECTION_TITLES[i]}</h2>
          {StepComponent}
        </div>
      ))}

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && (
        <p className="text-sm text-primary bg-primary-soft rounded-lg px-4 py-3">
          Alterações salvas com sucesso.
        </p>
      )}

      <Button onClick={handleSave} loading={saving} className="self-start">
        Salvar alterações
      </Button>
    </div>
  )
}
