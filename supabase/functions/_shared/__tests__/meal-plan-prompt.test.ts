import { describe, it, expect } from 'vitest'
import { buildProgressSummary } from '../meal-plan-prompt.ts'
import type { ProgressEntryRow } from '../meal-plan-prompt.ts'

describe('buildProgressSummary', () => {
  it('retorna null quando não há registros', () => {
    expect(buildProgressSummary([])).toBeNull()
  })

  it('não calcula tendência com um único registro', () => {
    const entries: ProgressEntryRow[] = [
      {
        recorded_at: '2026-08-01',
        weight_kg: 80,
        waist_cm: null,
        hip_cm: null,
        chest_cm: null,
        arm_cm: null,
        thigh_cm: null,
        body_fat_pct: null,
      },
    ]
    const summary = buildProgressSummary(entries)
    expect(summary?.latestWeightKg).toBe(80)
    expect(summary?.weightDeltaKg).toBeNull()
    expect(summary?.oldestRecordedAt).toBeNull()
  })

  it('calcula a variação de peso entre o registro mais antigo e o mais recente', () => {
    // Entradas vêm ordenadas do mais recente para o mais antigo (como a query faz)
    const entries: ProgressEntryRow[] = [
      {
        recorded_at: '2026-08-10',
        weight_kg: 78,
        waist_cm: 82,
        hip_cm: null,
        chest_cm: null,
        arm_cm: null,
        thigh_cm: null,
        body_fat_pct: null,
      },
      {
        recorded_at: '2026-07-01',
        weight_kg: 82,
        waist_cm: 88,
        hip_cm: null,
        chest_cm: null,
        arm_cm: null,
        thigh_cm: null,
        body_fat_pct: null,
      },
    ]
    const summary = buildProgressSummary(entries)
    expect(summary?.latestWeightKg).toBe(78)
    expect(summary?.weightDeltaKg).toBeCloseTo(-4)
    expect(summary?.oldestRecordedAt).toBe('2026-07-01')
    expect(summary?.latestMeasurements.waistCm).toBe(82)
  })

  it('inclui apenas as medidas que foram preenchidas', () => {
    const entries: ProgressEntryRow[] = [
      {
        recorded_at: '2026-08-10',
        weight_kg: 78,
        waist_cm: 82,
        hip_cm: null,
        chest_cm: null,
        arm_cm: 30,
        thigh_cm: null,
        body_fat_pct: 18.5,
      },
    ]
    const summary = buildProgressSummary(entries)
    expect(summary?.latestMeasurements).toEqual({
      waistCm: 82,
      hipCm: null,
      chestCm: null,
      armCm: 30,
      thighCm: null,
      bodyFatPct: 18.5,
    })
  })
})
