import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Menu persistente, exibido em todas as telas pós-login (painel, plano,
// central do usuário). Colapsa para ícones/rótulos curtos em telas estreitas.
export function AppHeader() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // "Meu plano" representa o destino /painel, mas na prática o usuário quase
  // nunca fica em /painel (ele só redireciona) — o "estar no meu plano" de
  // verdade acontece em /plano/:id ou /pagamento/:id. Por isso o destaque do
  // menu considera essas rotas também, não só o path exato do link.
  const isMyPlanActive =
    location.pathname === '/painel' ||
    location.pathname.startsWith('/plano/') ||
    location.pathname.startsWith('/pagamento/')
  const isCentralActive = location.pathname.startsWith('/central')

  const linkClass = (active: boolean) =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
      active ? 'bg-primary-soft text-primary-dark' : 'text-ink-soft hover:text-ink'
    }`

  async function handleSignOut() {
    await signOut()
    navigate('/entrar')
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/painel" className="font-display text-lg text-primary shrink-0">
          NutriPlano AI
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          <Link to="/painel" className={linkClass(isMyPlanActive)} aria-current={isMyPlanActive ? 'page' : undefined}>
            Meu plano
          </Link>
          <Link to="/central" className={linkClass(isCentralActive)} aria-current={isCentralActive ? 'page' : undefined}>
            Minha área
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-medium px-3 py-2 rounded-lg text-ink-soft hover:text-danger transition-colors"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  )
}
