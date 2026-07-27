import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import type { AnamnesisFormData } from '../../../types/anamnesis-form'

interface StepProps {
  data: AnamnesisFormData
  errors: Partial<Record<keyof AnamnesisFormData, string>>
  onChange: (field: keyof AnamnesisFormData, value: string) => void
}

export function MealsStep({ data, errors, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <Input
        label="Quantas refeições por dia você prefere?"
        type="number"
        inputMode="numeric"
        min="3"
        max="7"
        value={data.meals_per_day}
        error={errors.meals_per_day}
        onChange={(e) => onChange('meals_per_day', e.target.value)}
        hint="Recomendamos entre 4 e 6 para a maioria dos objetivos."
      />
      <Textarea
        label="Alimentos e preparações que você gosta"
        placeholder="Ex: arroz, feijão, frango grelhado, batata doce, frutas..."
        value={data.food_preferences}
        error={errors.food_preferences}
        onChange={(e) => onChange('food_preferences', e.target.value)}
      />
      <Textarea
        label="Alimentos que você não gosta ou não quer no plano"
        placeholder="Ex: peixe, brócolis, leite..."
        value={data.disliked_foods}
        error={errors.disliked_foods}
        onChange={(e) => onChange('disliked_foods', e.target.value)}
      />
    </div>
  )
}
