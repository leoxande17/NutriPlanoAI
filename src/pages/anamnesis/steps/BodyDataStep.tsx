import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import type { AnamnesisFormData } from '../../../types/anamnesis-form'

interface StepProps {
  data: AnamnesisFormData
  errors: Partial<Record<keyof AnamnesisFormData, string>>
  onChange: (field: keyof AnamnesisFormData, value: string) => void
}

export function BodyDataStep({ data, errors, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Peso (kg)"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="30"
          max="300"
          required
          value={data.weight_kg}
          error={errors.weight_kg}
          onChange={(e) => onChange('weight_kg', e.target.value)}
        />
        <Input
          label="Altura (cm)"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="100"
          max="250"
          required
          value={data.height_cm}
          error={errors.height_cm}
          onChange={(e) => onChange('height_cm', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Idade"
          type="number"
          inputMode="numeric"
          min="14"
          max="100"
          required
          value={data.age}
          error={errors.age}
          onChange={(e) => onChange('age', e.target.value)}
        />
        <Select
          label="Sexo"
          required
          placeholder="Selecione"
          value={data.gender}
          error={errors.gender}
          onChange={(e) => onChange('gender', e.target.value)}
          options={[
            { value: 'masculino', label: 'Masculino' },
            { value: 'feminino', label: 'Feminino' },
            { value: 'outro', label: 'Outro' },
          ]}
        />
      </div>
    </div>
  )
}
