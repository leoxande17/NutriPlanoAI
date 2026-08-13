import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Menu persistente, exibido em todas as telas pós-login (painel, plano,
// central do usuário). Colapsa para ícones/rótulos curtos em telas estreitas.
export function AppHeader() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
      isActive ? 'bg-primary-soft text-primary-dark' : 'text-ink-soft hover:text-ink'
    }`

  async function handleSignOut() {
    await signOut()
    navigate('/entrar')
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <NavLink to="/painel" className="font-display text-lg text-primary shrink-0">
          NutriPlano AI
        </NavLink>

        <nav className="flex items-center gap-1 overflow-x-auto">
          <NavLink to="/painel" className={linkClass} end>
            Meu plano
          </NavLink>
          <NavLink to="/central" className={linkClass}>
            Minha área
          </NavLink>
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
