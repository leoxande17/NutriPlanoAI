// Helper de chamada à API da Anthropic (Claude) a partir das Edge Functions.
// Docs: https://docs.claude.com/en/api/messages

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'

function getApiKey(): string {
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurado.')
  return key
}

// Chama a Claude API pedindo uma resposta em JSON estrito e faz o parse.
// Lança erro se a resposta não vier em JSON válido.
export async function callClaudeForJson<T>(system: string, userPrompt: string): Promise<T> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Erro na API da Anthropic:', data)
    throw new Error(data?.error?.message ?? 'Falha ao gerar o plano com a IA.')
  }

  const textBlocks = (data.content ?? [])
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text)
    .join('\n')

  const cleaned = textBlocks
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')

  try {
    return JSON.parse(cleaned) as T
  } catch (err) {
    console.error('Resposta da IA não é JSON válido:', textBlocks)
    throw new Error('A IA retornou uma resposta em formato inesperado.')
  }
}
