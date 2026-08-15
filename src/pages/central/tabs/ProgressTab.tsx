import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import type { ProgressEntry } from '../../../types/database'

type WindowOption = '30' | '90' | 'all'

interface MeasurementInputs {
  waist_cm: string
  hip_cm: string
  chest_cm: string
  arm_cm: string
  thigh_cm: string
  body_fat_pct: string
}

const MEASUREMENT_FIELDS: { key: keyof MeasurementInputs; label: string }[] = [
  { key: 'waist_cm', label: 'Cintura (cm)' },
  { key: 'hip_cm', label: 'Quadril (cm)' },
  { key: 'chest_cm', label: 'Peitoral (cm)' },
  { key: 'arm_cm', label: 'Braço (cm)' },
  { key: 'thigh_cm', label: 'Coxa (cm)' },
  { key: 'body_fat_pct', label: '% de gordura' },
]

const emptyMeasurements: MeasurementInputs = {
  waist_cm: '',
  hip_cm: '',
  chest_cm: '',
  arm_cm: '',
  thigh_cm: '',
  body_fat_pct: '',
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function ProgressTab() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [windowOption, setWindowOption] = useState<WindowOption>('90')

  const [showForm, setShowForm] = useState(false)
  const [weight, setWeight] = useState('')
  const [measurements, setMeasurements] = useState<MeasurementInputs>(emptyMeasurements)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadEntries() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(200)
    setEntries(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
    if (windowOption === 'all') return sorted
    const days = windowOption === '30' ? 30 : 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return sorted.filter((e) => new Date(e.recorded_at + 'T00:00:00') >= cutoff)
  }, [entries, windowOption])

  const chartData = filteredEntries.map((e) => ({
    date: formatDate(e.recorded_at),
    peso: Number(e.weight_kg),
  }))

  const latest = entries[0]
  const first = filteredEntries[0]
  const delta = latest && first ? Number(latest.weight_kg) - Number(first.weight_kg) : null

  async function handleSubmit() {
    if (!user || !weight) return
    setSaving(true)
    setError(null)

    const payload = {
      user_id: user.id,
      recorded_at: new Date().toISOString().slice(0, 10),
      weight_kg: Number(weight),
      waist_cm: measurements.waist_cm ? Number(measurements.waist_cm) : null,
      hip_cm: measurements.hip_cm ? Number(measurements.hip_cm) : null,
      chest_cm: measurements.chest_cm ? Number(measurements.chest_cm) : null,
      arm_cm: measurements.arm_cm ? Number(measurements.arm_cm) : null,
      thigh_cm: measurements.thigh_cm ? Number(measurements.thigh_cm) : null,
      body_fat_pct: measurements.body_fat_pct ? Number(measurements.body_fat_pct) : null,
      notes: null,
    }

    const { error: insertError } = await supabase.from('progress_entries').insert(payload)
    setSaving(false)

    if (insertError) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }

    setWeight('')
    setMeasurements(emptyMeasurements)
    setShowForm(false)
    loadEntries()
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      'Excluir este registro? Essa ação não pode ser desfeita.'
    )
    if (!confirmed) return

    setDeletingId(id)
    const { error: deleteError } = await supabase.from('progress_entries').delete().eq('id', id)
    setDeletingId(null)

    if (deleteError) {
      setError('Não foi possível excluir. Tente novamente.')
      return
    }
    loadEntries()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface rounded-2xl border border-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-ink">Evolução do peso</h2>
          {entries.length > 2 && (
            <div className="flex rounded-lg border border-line p-0.5">
              {(['30', '90', 'all'] as WindowOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setWindowOption(opt)}
                  className={`text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    windowOption === opt ? 'bg-primary text-white' : 'text-ink-soft'
                  }`}
                >
                  {opt === 'all' ? 'Tudo' : `${opt}d`}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && <p className="text-sm text-ink-soft py-8 text-center">Carregando...</p>}

        {!loading && entries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-ink-soft mb-4">
              Você ainda não registrou seu peso. Comece agora para acompanhar sua evolução ao
              longo do tempo.
            </p>
            <Button onClick={() => setShowForm(true)}>Registrar primeiro peso</Button>
          </div>
        )}

        {!loading && entries.length === 1 && (
          <div className="text-center py-6">
            <p className="font-mono-data text-2xl text-ink mb-1">{Number(latest.weight_kg)}kg</p>
            <p className="text-sm text-ink-soft">
              Registrado em {formatDate(latest.recorded_at)}. Registre mais algumas vezes para ver
              seu gráfico de evolução.
            </p>
          </div>
        )}

        {!loading && entries.length > 1 && (
          <>
            <div className="flex gap-6 mb-4">
              <div>
                <p className="font-mono-data text-2xl text-ink">{Number(latest.weight_kg)}kg</p>
                <p className="text-xs text-ink-soft">Último registro · {formatDate(latest.recorded_at)}</p>
              </div>
              {delta !== null && (
                <div>
                  <p className={`font-mono-data text-2xl ${delta <= 0 ? 'text-primary' : 'text-coral'}`}>
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(1)}kg
                  </p>
                  <p className="text-xs text-ink-soft">Desde {formatDate(first.recorded_at)}</p>
                </div>
              )}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE4DC" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4A5A50' }} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11, fill: '#4A5A50' }} width={40} />
                <Tooltip
                  formatter={(value) => [`${value}kg`, 'Peso']}
                  contentStyle={{ borderRadius: 8, borderColor: '#DDE4DC', fontSize: 13 }}
                />
                <Line type="monotone" dataKey="peso" stroke="#1F4D3A" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {!loading && entries.length > 0 && (
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <p className="text-xs text-ink-soft uppercase tracking-wide font-mono-data px-5 pt-4 pb-2">
            Registros recentes
          </p>
          {entries.slice(0, 5).map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between gap-4 px-5 py-3 ${
                i !== Math.min(entries.length, 5) - 1 ? 'border-b border-line' : ''
              }`}
            >
              <div>
                <span className="font-mono-data text-sm text-ink">{Number(entry.weight_kg)}kg</span>
                <span className="text-xs text-ink-soft ml-2">{formatDate(entry.recorded_at)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
                className="text-xs text-ink-soft hover:text-danger transition-colors px-2 py-1"
                aria-label={`Excluir registro de ${Number(entry.weight_kg)}kg em ${formatDate(entry.recorded_at)}`}
              >
                {deletingId === entry.id ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && !showForm && (
        <Button variant="ghost" onClick={() => setShowForm(true)} className="self-start">
          + Novo registro
        </Button>
      )}

      {showForm && (
        <div className="bg-surface rounded-2xl border border-line p-6">
          <h3 className="font-display text-base text-ink mb-4">Novo registro</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Peso (kg)"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="30"
              max="300"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <p className="text-xs text-ink-soft uppercase tracking-wide font-mono-data mb-2">
            Medidas (opcional)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {MEASUREMENT_FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={measurements[key]}
                onChange={(e) => setMeasurements((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            ))}
          </div>
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={handleSubmit} loading={saving} disabled={!weight}>
              Salvar registro
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
