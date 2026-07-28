// Helper de chamada à API da OpenAI a partir das Edge Functions.
// Docs: https://platform.openai.com/docs/api-reference/chat

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// gpt-4.1-mini é um bom equilíbrio custo/qualidade para essa tarefa
// (JSON estruturado, não precisa de raciocínio complexo). Pode trocar via
// secret OPENAI_MODEL — ex: "gpt-4.1-nano" para custo ainda menor.
const DEFAULT_MODEL = 'gpt-4.1-mini'

function getApiKey(): string {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) throw new Error('OPENAI_API_KEY não configurado.')
  return key
}

function getModel(): string {
  return Deno.env.get('OPENAI_MODEL') ?? DEFAULT_MODEL
}

// Chama a API da OpenAI (Chat Completions, com json_object mode) pedindo uma
// resposta em JSON estrito e faz o parse. Lança erro se a resposta não vier
// em JSON válido.
export async function callOpenAIForJson<T>(system: string, userPrompt: string): Promise<T> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Erro na API da OpenAI:', data)
    throw new Error(data?.error?.message ?? 'Falha ao gerar o plano com a IA.')
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    console.error('Resposta da OpenAI sem conteúdo:', data)
    throw new Error('A IA não retornou conteúdo.')
  }

  try {
    return JSON.parse(content) as T
  } catch (err) {
    console.error('Resposta da IA não é JSON válido:', content)
    throw new Error('A IA retornou uma resposta em formato inesperado.')
  }
}
