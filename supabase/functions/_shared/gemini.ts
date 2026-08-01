// Helper de chamada à API do Google Gemini a partir das Edge Functions.
// Docs: https://ai.google.dev/gemini-api/docs
//
// Usa o tier gratuito do Gemini (Flash / Flash-Lite) — sem cartão de crédito.
// Atenção: no tier gratuito, o Google pode usar os prompts/respostas para
// melhorar os próprios produtos (diferente do tier pago). Ok para este caso de
// uso, mas vale saber.

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Usamos o alias "gemini-flash-latest", que sempre aponta para o modelo Flash
// mais recente disponível na conta — evita quebrar quando o Google descontinua
// uma versão específica (ex: gemini-2.5-flash deixou de estar disponível para
// contas novas em 2026). Para custo ainda menor, troque via secret GEMINI_MODEL
// para "gemini-flash-lite-latest".
const DEFAULT_MODEL = 'gemini-flash-latest'

function getApiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new Error('GEMINI_API_KEY não configurado.')
  return key
}

function getModel(): string {
  return Deno.env.get('GEMINI_MODEL') ?? DEFAULT_MODEL
}

// Chama a API do Gemini pedindo uma resposta em JSON estrito (response_mime_type)
// e faz o parse. Lança erro se a resposta não vier em JSON válido.
export async function callGeminiForJson<T>(system: string, userPrompt: string): Promise<T> {
  const url = `${GEMINI_API_BASE}/${getModel()}:generateContent`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': getApiKey(),
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.7,
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Erro na API do Gemini:', data)
    throw new Error(data?.error?.message ?? 'Falha ao gerar o plano com a IA.')
  }

  const content: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    console.error('Resposta do Gemini sem conteúdo:', data)
    // Motivo comum: finishReason "MAX_TOKENS" ou bloqueio por safety settings.
    const finishReason = data.candidates?.[0]?.finishReason
    throw new Error(
      finishReason
        ? `A IA não retornou conteúdo (finishReason: ${finishReason}).`
        : 'A IA não retornou conteúdo.'
    )
  }

  try {
    return JSON.parse(content) as T
  } catch (err) {
    console.error('Resposta da IA não é JSON válido:', content)
    throw new Error('A IA retornou uma resposta em formato inesperado.')
  }
}
