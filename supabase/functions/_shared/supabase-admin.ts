// Cliente Supabase com service_role — só deve ser usado dentro de Edge Functions
// (nunca exposto ao frontend). Ignora RLS, então cada função deve validar
// manualmente que o usuário só acessa/altera os próprios dados.
import { createClient } from 'jsr:@supabase/supabase-js@2'

export function getSupabaseAdmin() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Extrai e valida o usuário autenticado a partir do header Authorization,
// usando a anon key (necessária para validar o JWT do usuário).
export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { user: null, error: 'Não autenticado.' }

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) return { user: null, error: 'Configuração ausente.' }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { user: null, error: 'Token inválido ou expirado.' }

  return { user: data.user, error: null }
}
