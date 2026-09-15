import { useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '../../components/layout/AppHeader'

// Tela de escolha ao renovar um plano expirado: reaproveitar a anamnese
// atual (pula direto pro pagamento) ou refazer do zero (fluxo normal de
// anamnese, que já cria um novo registro e encaminha pro pagamento sozinho).
// Nenhuma das duas opções precisa de lógica nova de backend — só reusam as
// rotas /pagamento e /anamnese que já existem.
export function RenewPage() {
  const { anamnesisId } = useParams<{ anamnesisId: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <div className="mb-8 text-center">
          <p className="font-mono-data text-xs uppercase tracking-widest text-coral mb-2">
            Renovar plano
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-ink mb-2">
            Vamos gerar seu novo plano
          </h1>
          <p className="text-ink-soft max-w-md mx-auto">
            Sua janela de ajustes anterior encerrou. Para continuar, escolha como quer seguir —
            o pagamento é o mesmo de sempre, R$ 29,90.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => anamnesisId && navigate(`/pagamento/${anamnesisId}`)}
            disabled={!anamnesisId}
            className="text-left bg-surface rounded-2xl border-2 border-line hover:border-primary transition-colors p-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <h2 className="font-display text-lg text-ink mb-2">Manter minhas respostas</h2>
            <p className="text-sm text-ink-soft">
              Usamos os dados que você já informou na anamnese (peso, objetivo, treino,
              preferências) para gerar o novo plano direto.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/anamnese')}
            className="text-left bg-surface rounded-2xl border-2 border-line hover:border-primary transition-colors p-6"
          >
            <h2 className="font-display text-lg text-ink mb-2">Refazer anamnese</h2>
            <p className="text-sm text-ink-soft">
              Útil se seu peso, objetivo, rotina de treino ou preferências mudaram desde a
              última vez.
            </p>
          </button>
        </div>

        <p className="text-xs text-ink-soft text-center mt-6">
          Dica: se você só quer registrar seu peso mais recente, pode fazer isso em{' '}
          <button type="button" onClick={() => navigate('/central')} className="underline">
            Minha área → Evolução
          </button>{' '}
          antes de decidir.
        </p>
      </div>
    </div>
  )
}
