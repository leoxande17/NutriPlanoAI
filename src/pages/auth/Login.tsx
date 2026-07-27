import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      setError(error)
      return
    }
    navigate('/painel')
  }

  return (
    <AuthLayout
      eyebrow="Bem-vindo de volta"
      title="Entrar na sua conta"
      subtitle="Acesse seu plano alimentar e continue de onde parou."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end -mt-2">
          <Link to="/esqueci-minha-senha" className="text-sm text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full mt-2">
          Entrar
        </Button>
      </form>

      <p className="text-sm text-ink-soft mt-8 text-center">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="text-primary font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
