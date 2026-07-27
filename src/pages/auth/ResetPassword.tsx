import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'

// Página acessada a partir do link enviado por e-mail (ver ForgotPassword).
// O Supabase já autentica a sessão temporária via o token presente na URL.
export function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) {
      setError(error)
      return
    }
    navigate('/entrar')
  }

  return (
    <AuthLayout
      eyebrow="Última etapa"
      title="Criar nova senha"
      subtitle="Escolha uma senha nova para acessar sua conta."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          required
          hint="Mínimo de 6 caracteres."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirmar nova senha"
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
          Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  )
}
