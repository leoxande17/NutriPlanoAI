import { Input } from '../../../components/ui/Input'
import type { AnamnesisFormData } from '../../../types/anamnesis-form'

interface StepProps {
  data: AnamnesisFormData
  errors: Partial<Record<keyof AnamnesisFormData, string>>
  onChange: (field: keyof AnamnesisFormData, value: string) => void
  onToggleTrains: (value: boolean) => void
}

export function TrainingStep({ data, errors, onChange, onToggleTrains }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="text-sm font-medium text-ink block mb-2">Você treina atualmente?</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onToggleTrains(true)}
            className={`flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-colors ${
              data.trains ? 'border-primary bg-primary-soft text-primary-dark' : 'border-line text-ink-soft'
            }`}
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => onToggleTrains(false)}
            className={`flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-colors ${
              !data.trains ? 'border-primary bg-primary-soft text-primary-dark' : 'border-line text-ink-soft'
            }`}
          >
            Não
          </button>
        </div>
      </div>

      {data.trains && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dias de treino por semana"
              type="number"
              inputMode="numeric"
              min="1"
              max="7"
              value={data.training_days_per_week}
              error={errors.training_days_per_week}
              onChange={(e) => onChange('training_days_per_week', e.target.value)}
            />
            <Input
              label="Horário habitual"
              type="time"
              value={data.training_time}
              error={errors.training_time}
              onChange={(e) => onChange('training_time', e.target.value)}
            />
          </div>
          <Input
            label="Tipo de treino"
            type="text"
            placeholder="Ex: Musculação (PPL), corrida, crossfit..."
            value={data.training_type}
            error={errors.training_type}
            onChange={(e) => onChange('training_type', e.target.value)}
          />
        </>
      )}
    </div>
  )
}
