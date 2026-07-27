import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { MacroRing } from '../components/ui/MacroRing'

// Placeholder — será substituído pelo fluxo real de pagamento/plano
// nas próximas etapas do desenvolvimento.
export function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 p-6 text-center">
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
      <Button variant="ghost" onClick={signOut}>
        Sair da conta
      </Button>
    </div>
  )
}
