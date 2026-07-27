import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'

export function Signup() {
  const { signUp } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, fullName)
    setLoading(false)

    if (error) {
      setError(error)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <AuthLayout
        eyebrow="Quase lá"
        title="Confirme seu e-mail"
        subtitle="Enviamos um link de confirmação para você."
      >
        <div className="rounded-lg bg-primary-soft px-5 py-4 text-sm text-primary-dark">
          Enviamos um e-mail de confirmação para <strong>{email}</strong>. Abra sua caixa de
          entrada e clique no link para ativar sua conta.
        </div>
        <p className="text-sm text-ink-soft mt-6 text-center">
          Já confirmou?{' '}
          <Link to="/entrar" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Comece agora"
      title="Criar sua conta"
      subtitle="Leva menos de um minuto. Depois é só responder sua anamnese."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Nome completo"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          required
          hint="Mínimo de 6 caracteres."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full mt-2">
          Criar conta
        </Button>
      </form>

      <p className="text-sm text-ink-soft mt-8 text-center">
        Já tem conta?{' '}
        <Link to="/entrar" className="text-primary font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
