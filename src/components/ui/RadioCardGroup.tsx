interface RadioCardOption {
  value: string
  title: string
  description: string
}

interface RadioCardGroupProps {
  label: string
  name: string
  options: RadioCardOption[]
  value: string
  onChange: (value: string) => void
  error?: string
}

export function RadioCardGroup({ label, name, options, value, onChange, error }: RadioCardGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-ink mb-1">{label}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                selected
                  ? 'border-primary bg-primary-soft'
                  : 'border-line bg-surface hover:border-primary/40'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span className="block font-medium text-sm text-ink">{opt.title}</span>
              <span className="block text-xs text-ink-soft mt-1">{opt.description}</span>
            </label>
          )
        })}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </fieldset>
  )
}
