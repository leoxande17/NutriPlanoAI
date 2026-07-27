import { useState } from 'react'
import type { KeyboardEvent } from 'react'

interface ChipMultiSelectProps {
  label: string
  hint?: string
  suggestions: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function ChipMultiSelect({
  label,
  hint,
  suggestions,
  value,
  onChange,
  placeholder = 'Digite e pressione Enter',
}: ChipMultiSelectProps) {
  const [draft, setDraft] = useState('')

  function addItem(item: string) {
    const trimmed = item.trim()
    if (!trimmed) return
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, trimmed])
    setDraft('')
  }

  function removeItem(item: string) {
    onChange(value.filter((v) => v !== item))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addItem(draft)
    }
  }

  const remainingSuggestions = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink">{label}</label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft text-primary-dark text-sm px-3 py-1.5"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                aria-label={`Remover ${item}`}
                className="text-primary-dark/70 hover:text-primary-dark"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => draft && addItem(draft)}
        placeholder={placeholder}
        className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary transition-colors"
      />

      {remainingSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {remainingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addItem(s)}
              className="rounded-full border border-line text-ink-soft text-xs px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {hint && <p className="text-sm text-ink-soft">{hint}</p>}
    </div>
  )
}
