import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { MacroRing } from '../components/ui/MacroRing'
import { AppHeader } from '../components/layout/AppHeader'

// Painel funciona como um "roteador inteligente": ao logar, verifica o que o
// usuário já preencheu/pagou e manda direto para a etapa certa, em vez de
// sempre pedir pra responder a anamnese de novo.
// - Sem anamnese respondida        -> mostra CTA para responder
// - Anamnese respondida, sem pagamento aprovado -> redireciona para pagamento
// - Pagamento aprovado             -> redireciona direto para o plano
export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function routeUser() {
      if (!user) return

      const { data: anamnesis } = await supabase
        .from('anamnesis')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (!anamnesis) {
        setChecking(false)
        return
      }

      const { data: payment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('anamnesis_id', anamnesis.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (payment?.status === 'approved') {
        navigate(`/plano/${payment.id}`, { replace: true })
        return
      }

      navigate(`/pagamento/${anamnesis.id}`, { replace: true })
    }

    routeUser()

    return () => {
      cancelled = true
    }
  }, [user, navigate])

  if (checking) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
          aria-hidden="true"
        />
      </div>
    )
  }

  // Só chega aqui quando não há anamnese respondida ainda
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <div className="flex flex-col items-center justify-center gap-6 p-6 text-center py-20">
        <MacroRing size={140} />
        <div>
          <p className="font-mono-data text-xs uppercase tracking-widest text-coral mb-2">
            Painel
          </p>
          <h1 className="font-display text-3xl text-ink mb-2">
            Bem-vindo, {user?.user_metadata?.full_name?.split(' ')[0] ?? 'tudo pronto'}!
          </h1>
          <p className="text-ink-soft max-w-sm">
            Responda sua anamnese para gerarmos seu plano alimentar personalizado.
          </p>
        </div>
        <Button onClick={() => navigate('/anamnese')}>Responder anamnese</Button>
      </div>
    </div>
  )
}
