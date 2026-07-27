import type { TextareaHTMLAttributes } from 'react'
import { useId } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, id, className = '', ...props }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textareaId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-invalid={!!error}
        rows={3}
        className={`rounded-lg border bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary transition-colors resize-none ${
          error ? 'border-danger' : 'border-line'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {!error && hint && <p className="text-sm text-ink-soft">{hint}</p>}
    </div>
  )
}
