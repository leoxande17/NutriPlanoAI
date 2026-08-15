import { describe, it, expect } from 'vitest'
import { planVersionLabel } from '../planVersionLabel'

describe('planVersionLabel', () => {
  it('rotula a versão 1 como "Plano original"', () => {
    expect(planVersionLabel({ version: 1, created_at: '2026-08-01T10:00:00Z' })).toBe(
      'Plano original'
    )
  })

  it('rotula versões seguintes como "Ajuste de DD/MM"', () => {
    const label = planVersionLabel({ version: 2, created_at: '2026-08-12T10:00:00Z' })
    expect(label).toMatch(/^Ajuste de \d{2}\/\d{2}$/)
  })

  it('nunca expõe o número técnico da versão para versões > 1', () => {
    const label = planVersionLabel({ version: 5, created_at: '2026-08-12T10:00:00Z' })
    expect(label).not.toContain('5')
  })
})
