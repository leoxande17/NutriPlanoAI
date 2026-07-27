// Validação da assinatura HMAC-SHA256 enviada pelo Mercado Pago no header x-signature.
// Extraído em módulo próprio (sem dependências de Deno.env) para ser testável
// isoladamente com Vitest/Node.
//
// Formato do header: "ts=1742505638683,v1=<hash>"
// Manifest assinado: "id:{data.id};request-id:{x-request-id};ts:{ts};"

export function parseSignatureHeader(xSignature: string): { ts?: string; v1?: string } {
  return Object.fromEntries(
    xSignature.split(',').map((p) => {
      const [k, v] = p.split('=')
      return [k?.trim(), v?.trim()]
    })
  )
}

export function buildManifest(dataId: string, requestId: string | null, ts: string): string {
  return `id:${dataId.toLowerCase()};request-id:${requestId ?? ''};ts:${ts};`
}

export async function computeHmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function isValidSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null,
  secret: string
): Promise<boolean> {
  if (!xSignature || !dataId) return false

  const { ts, v1 } = parseSignatureHeader(xSignature)
  if (!ts || !v1) return false

  const manifest = buildManifest(dataId, xRequestId, ts)
  const computedHex = await computeHmacHex(secret, manifest)

  return computedHex === v1
}
