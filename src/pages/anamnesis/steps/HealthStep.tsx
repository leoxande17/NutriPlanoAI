import { ChipMultiSelect } from '../../../components/ui/ChipMultiSelect'
import { Textarea } from '../../../components/ui/Textarea'
import type { AnamnesisFormData } from '../../../types/anamnesis-form'

interface StepProps {
  data: AnamnesisFormData
  errors: Partial<Record<keyof AnamnesisFormData, string>>
  onChange: (field: keyof AnamnesisFormData, value: string) => void
  onChangeArray: (field: 'allergies' | 'dietary_restrictions', value: string[]) => void
}

const COMMON_ALLERGIES = ['Lactose', 'Glúten', 'Amendoim', 'Frutos do mar', 'Ovo', 'Soja']
const COMMON_RESTRICTIONS = [
  'Vegetariano',
  'Vegano',
  'Low carb',
  'Sem lactose',
  'Sem glúten',
  'Restrição religiosa',
]

export function HealthStep({ data, errors, onChange, onChangeArray }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <ChipMultiSelect
        label="Alergias alimentares"
        suggestions={COMMON_ALLERGIES}
        value={data.allergies}
        onChange={(v) => onChangeArray('allergies', v)}
        placeholder="Digite outra alergia e pressione Enter"
      />

      <ChipMultiSelect
        label="Restrições alimentares"
        suggestions={COMMON_RESTRICTIONS}
        value={data.dietary_restrictions}
        onChange={(v) => onChangeArray('dietary_restrictions', v)}
        placeholder="Digite outra restrição e pressione Enter"
      />

      <Textarea
        label="Condições de saúde relevantes (opcional)"
        placeholder="Ex: diabetes, hipertensão, problemas intestinais..."
        hint="Essas informações ajudam a IA a adaptar o plano com mais segurança."
        value={data.medical_conditions}
        error={errors.medical_conditions}
        onChange={(e) => onChange('medical_conditions', e.target.value)}
      />
    </div>
  )
}
