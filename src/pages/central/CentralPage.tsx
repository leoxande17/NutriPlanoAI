import { useState } from 'react'
import { AppHeader } from '../../components/layout/AppHeader'
import { ProgressTab } from './tabs/ProgressTab'
import { PlansHistoryTab } from './tabs/PlansHistoryTab'
import { PaymentsTab } from './tabs/PaymentsTab'
import { AnamnesisEditTab } from './tabs/AnamnesisEditTab'

type Tab = 'progress' | 'plans' | 'anamnesis' | 'payments'

const TABS: { key: Tab; label: string }[] = [
  { key: 'progress', label: 'Evolução' },
  { key: 'plans', label: 'Histórico de planos' },
  { key: 'anamnesis', label: 'Anamnese' },
  { key: 'payments', label: 'Pagamentos' },
]

export function CentralPage() {
  const [tab, setTab] = useState<Tab>('progress')

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="font-mono-data text-xs uppercase tracking-widest text-coral mb-1">
            Minha área
          </p>
          <h1 className="font-display text-2xl text-ink">Seu histórico e sua evolução</h1>
        </div>

        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap text-sm font-medium px-4 py-3 border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-primary text-primary-dark' : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'progress' && <ProgressTab />}
        {tab === 'plans' && <PlansHistoryTab />}
        {tab === 'anamnesis' && <AnamnesisEditTab />}
        {tab === 'payments' && <PaymentsTab />}
      </div>
    </div>
  )
}
