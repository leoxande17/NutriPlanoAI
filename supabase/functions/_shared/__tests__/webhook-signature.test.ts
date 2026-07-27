import { describe, it, expect } from 'vitest'
import {
  isValidSignature,
  buildManifest,
  computeHmacHex,
  parseSignatureHeader,
} from '../webhook-signature.ts'

const SECRET = 'test-webhook-secret'

async function makeValidHeader(dataId: string, requestId: string, ts: string) {
  const manifest = buildManifest(dataId, requestId, ts)
  const v1 = await computeHmacHex(SECRET, manifest)
  return `ts=${ts},v1=${v1}`
}

describe('parseSignatureHeader', () => {
  it('extrai ts e v1 do header', () => {
    const parsed = parseSignatureHeader('ts=123,v1=abcdef')
    expect(parsed.ts).toBe('123')
    expect(parsed.v1).toBe('abcdef')
  })
})

describe('isValidSignature', () => {
  it('aceita uma assinatura válida', async () => {
    const dataId = 'ORD123456789'
    const requestId = 'req-abc'
    const ts = '1742505638683'
    const header = await makeValidHeader(dataId, requestId, ts)

    const valid = await isValidSignature(header, requestId, dataId, SECRET)
    expect(valid).toBe(true)
  })

  it('rejeita quando o secret está errado', async () => {
    const dataId = 'ORD123456789'
    const requestId = 'req-abc'
    const ts = '1742505638683'
    const header = await makeValidHeader(dataId, requestId, ts)

    const valid = await isValidSignature(header, requestId, dataId, 'secret-errado')
    expect(valid).toBe(false)
  })

  it('rejeita quando o data.id foi adulterado (tentativa de replay/forjar order)', async () => {
    const requestId = 'req-abc'
    const ts = '1742505638683'
    const header = await makeValidHeader('ORD_ORIGINAL', requestId, ts)

    // Um atacante tenta reaproveitar a assinatura para uma order diferente
    const valid = await isValidSignature(header, requestId, 'ORD_FORJADA', SECRET)
    expect(valid).toBe(false)
  })

  it('rejeita quando o header está ausente', async () => {
    const valid = await isValidSignature(null, 'req-abc', 'ORD123', SECRET)
    expect(valid).toBe(false)
  })

  it('rejeita quando falta o campo v1 no header', async () => {
    const valid = await isValidSignature('ts=123', 'req-abc', 'ORD123', SECRET)
    expect(valid).toBe(false)
  })

  it('é case-insensitive para o data.id (normaliza para minúsculas)', async () => {
    const requestId = 'req-abc'
    const ts = '1742505638683'
    const header = await makeValidHeader('ordabc123', requestId, ts)

    const valid = await isValidSignature(header, requestId, 'ORDABC123', SECRET)
    expect(valid).toBe(true)
  })
})
