// supabase-js não expõe automaticamente o corpo da resposta de erro das Edge
// Functions — precisa ler o Response bruto em error.context para pegar a
// mensagem real que a function devolveu.
export async function extractErrorMessage(error: unknown, fallback: string): Promise<string> {
  try {
    const context = (error as { context?: Response })?.context
    if (context && typeof context.json === 'function') {
      const body = await context.json()
      if (body?.error) return body.error as string
    }
  } catch {
    // ignora e usa o fallback
  }
  return fallback
}
