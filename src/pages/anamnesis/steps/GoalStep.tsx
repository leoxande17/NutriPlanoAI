import { RadioCardGroup } from '../../../components/ui/RadioCardGroup'
import { Select } from '../../../components/ui/Select'
import type { AnamnesisFormData } from '../../../types/anamnesis-form'

interface StepProps {
  data: AnamnesisFormData
  errors: Partial<Record<keyof AnamnesisFormData, string>>
  onChange: (field: keyof AnamnesisFormData, value: string) => void
}

export function GoalStep({ data, errors, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <RadioCardGroup
        label="Qual é o seu principal objetivo?"
        name="goal"
        value={data.goal}
        error={errors.goal}
        onChange={(v) => onChange('goal', v)}
        options={[
          { value: 'emagrecimento', title: 'Emagrecimento', description: 'Reduzir gordura corporal' },
          { value: 'hipertrofia', title: 'Hipertrofia', description: 'Ganhar massa muscular' },
          {
            value: 'recomposicao',
            title: 'Recomposição corporal',
            description: 'Perder gordura e ganhar músculo',
          },
          { value: 'manutencao', title: 'Manutenção', description: 'Manter peso e composição atuais' },
        ]}
      />

      <Select
        label="Nível de atividade física no dia a dia"
        placeholder="Selecione"
        value={data.activity_level}
        error={errors.activity_level}
        onChange={(e) => onChange('activity_level', e.target.value)}
        options={[
          { value: 'sedentario', label: 'Sedentário (pouco ou nenhum exercício)' },
          { value: 'leve', label: 'Leve (exercício leve 1-3x/semana)' },
          { value: 'moderado', label: 'Moderado (exercício moderado 3-5x/semana)' },
          { value: 'intenso', label: 'Intenso (exercício pesado 6-7x/semana)' },
          { value: 'atleta', label: 'Atleta (treino + atividade física intensa)' },
        ]}
      />
    </div>
  )
}
