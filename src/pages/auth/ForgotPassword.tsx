import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'

export function ForgotPassword() {
  const { requestPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await requestPasswordReset(email)
    setLoading(false)

    if (error) {
      setError(error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout
        eyebrow="Verifique seu e-mail"
        title="Link enviado"
        subtitle="Siga as instruções para criar uma nova senha."
      >
        <div className="rounded-lg bg-primary-soft px-5 py-4 text-sm text-primary-dark">
          Se existir uma conta com o e-mail <strong>{email}</strong>, você vai receber um link
          para redefinir sua senha em instantes.
        </div>
        <p className="text-sm text-ink-soft mt-6 text-center">
          <Link to="/entrar" className="text-primary font-medium hover:underline">
            Voltar para o login
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Recuperar acesso"
      title="Esqueci minha senha"
      subtitle="Informe seu e-mail e enviaremos um link para você criar uma nova senha."
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

        {error && (
          <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full mt-2">
          Enviar link de recuperação
        </Button>
      </form>

      <p className="text-sm text-ink-soft mt-8 text-center">
        Lembrou a senha?{' '}
        <Link to="/entrar" className="text-primary font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
