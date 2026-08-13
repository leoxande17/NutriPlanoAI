import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import type { Payment } from '../../../types/database'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  approved: { label: 'Aprovado', className: 'bg-primary-soft text-primary-dark' },
  pending: { label: 'Pendente', className: 'bg-mango/20 text-ink' },
  rejected: { label: 'Recusado', className: 'bg-danger/10 text-danger' },
  refunded: { label: 'Reembolsado', className: 'bg-line text-ink-soft' },
  expired: { label: 'Expirado', className: 'bg-line text-ink-soft' },
}

export function PaymentsTab() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setPayments(data ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return <p className="text-sm text-ink-soft py-8 text-center">Carregando...</p>
  }

  if (payments.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-line p-8 text-center">
        <p className="text-sm text-ink-soft">Nenhum pagamento registrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden">
      {payments.map((payment, i) => {
        const status = STATUS_LABELS[payment.status] ?? STATUS_LABELS.pending
        return (
          <div
            key={payment.id}
            className={`flex items-center justify-between gap-4 px-5 py-4 ${
              i !== payments.length - 1 ? 'border-b border-line' : ''
            }`}
          >
            <div>
              <p className="font-mono-data text-sm text-ink">
                R$ {Number(payment.amount).toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-ink-soft mt-0.5">
                {new Date(payment.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
                {payment.expires_at && payment.status === 'approved' && (
                  <>
                    {' '}
                    · ajustes até{' '}
                    {new Date(payment.expires_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </>
                )}
              </p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.className}`}>
              {status.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
