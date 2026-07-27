import type { AnamnesisFormData } from '../../../types/anamnesis-form'

interface ReviewStepProps {
  data: AnamnesisFormData
  onEditStep: (step: number) => void
}

const GOAL_LABELS: Record<string, string> = {
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  recomposicao: 'Recomposição corporal',
  manutencao: 'Manutenção',
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentario: 'Sedentário',
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
  atleta: 'Atleta',
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-line last:border-0">
      <div>
        <p className="text-xs text-ink-soft uppercase tracking-wide font-mono-data">{label}</p>
        <p className="text-sm text-ink mt-0.5">{value || '—'}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs text-primary hover:underline shrink-0 mt-0.5"
      >
        Editar
      </button>
    </div>
  )
}

export function ReviewStep({ data, onEditStep }: ReviewStepProps) {
  return (
    <div className="flex flex-col">
      <ReviewRow
        label="Dados corporais"
        value={`${data.weight_kg}kg · ${data.height_cm}cm · ${data.age} anos · ${data.gender}`}
        onEdit={() => onEditStep(0)}
      />
      <ReviewRow
        label="Objetivo"
        value={`${GOAL_LABELS[data.goal] ?? ''} · Atividade ${ACTIVITY_LABELS[data.activity_level] ?? ''}`}
        onEdit={() => onEditStep(1)}
      />
      <ReviewRow
        label="Treino"
        value={
          data.trains
            ? `${data.training_type || 'Não especificado'} · ${data.training_days_per_week}x/semana às ${data.training_time}`
            : 'Não treina atualmente'
        }
        onEdit={() => onEditStep(2)}
      />
      <ReviewRow
        label="Refeições"
        value={`${data.meals_per_day} por dia`}
        onEdit={() => onEditStep(3)}
      />
      <ReviewRow
        label="Preferências alimentares"
        value={data.food_preferences}
        onEdit={() => onEditStep(3)}
      />
      <ReviewRow label="Não gosta de" value={data.disliked_foods} onEdit={() => onEditStep(3)} />
      <ReviewRow
        label="Alergias"
        value={data.allergies.join(', ')}
        onEdit={() => onEditStep(4)}
      />
      <ReviewRow
        label="Restrições alimentares"
        value={data.dietary_restrictions.join(', ')}
        onEdit={() => onEditStep(4)}
      />
      <ReviewRow
        label="Condições de saúde"
        value={data.medical_conditions}
        onEdit={() => onEditStep(4)}
      />
    </div>
  )
}
