import { describe, it, expect } from 'vitest'
import { validateAnamnesisStep, validateAllAnamnesisSteps } from '../validateAnamnesisStep'
import { initialAnamnesisFormData } from '../../types/anamnesis-form'
import type { AnamnesisFormData } from '../../types/anamnesis-form'

function validData(): AnamnesisFormData {
  return {
    ...initialAnamnesisFormData,
    weight_kg: '80',
    height_cm: '178',
    age: '30',
    gender: 'masculino',
    goal: 'emagrecimento',
    activity_level: 'moderado',
    trains: true,
    training_days_per_week: '5',
    training_time: '17:20',
    training_type: 'Musculação',
    meals_per_day: '5',
  }
}

describe('validateAnamnesisStep', () => {
  it('não retorna erros para dados válidos completos', () => {
    const data = validData()
    for (let step = 0; step <= 3; step++) {
      expect(validateAnamnesisStep(step, data)).toEqual({})
    }
  })

  it('exige peso, altura, idade e sexo válidos na etapa 0', () => {
    const errors = validateAnamnesisStep(0, { ...validData(), weight_kg: '', gender: '' })
    expect(errors.weight_kg).toBeDefined()
    expect(errors.gender).toBeDefined()
  })

  it('rejeita peso zero ou negativo (não passa silenciosamente como válido)', () => {
    const errors = validateAnamnesisStep(0, { ...validData(), weight_kg: '0' })
    expect(errors.weight_kg).toBeDefined()
  })

  it('exige objetivo e nível de atividade na etapa 1', () => {
    const errors = validateAnamnesisStep(1, { ...validData(), goal: '', activity_level: '' })
    expect(errors.goal).toBeDefined()
    expect(errors.activity_level).toBeDefined()
  })

  it('só exige dados de treino na etapa 2 quando "trains" é true', () => {
    const notTraining = validateAnamnesisStep(2, {
      ...validData(),
      trains: false,
      training_type: '',
    })
    expect(notTraining).toEqual({})

    const training = validateAnamnesisStep(2, {
      ...validData(),
      trains: true,
      training_type: '',
    })
    expect(training.training_type).toBeDefined()
  })

  it('exige ao menos 3 refeições por dia na etapa 3', () => {
    const errors = validateAnamnesisStep(3, { ...validData(), meals_per_day: '2' })
    expect(errors.meals_per_day).toBeDefined()
  })
})

describe('validateAllAnamnesisSteps', () => {
  it('não retorna erros para um formulário completo e válido', () => {
    expect(validateAllAnamnesisSteps(validData())).toEqual({})
  })

  it('acumula erros de múltiplas seções ao mesmo tempo (usado na tela de edição)', () => {
    const errors = validateAllAnamnesisSteps({
      ...validData(),
      weight_kg: '', // seção 0
      goal: '', // seção 1
      meals_per_day: '1', // seção 3
    })
    expect(errors.weight_kg).toBeDefined()
    expect(errors.goal).toBeDefined()
    expect(errors.meals_per_day).toBeDefined()
  })

  it('detecta valores inválidos mesmo quando o campo tecnicamente "tem conteúdo"', () => {
    // Regressão do bug real: editar e apagar o peso deixava o campo vazio,
    // e Number('') vira 0 e era salvo sem aviso.
    const errors = validateAllAnamnesisSteps({ ...validData(), weight_kg: '' })
    expect(errors.weight_kg).toBeDefined()
  })
})
