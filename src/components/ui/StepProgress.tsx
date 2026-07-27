interface StepProgressProps {
  steps: string[]
  currentStep: number // 0-indexed
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  const percent = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono-data text-xs uppercase tracking-widest text-coral">
          Etapa {currentStep + 1} de {steps.length}
        </p>
        <p className="font-mono-data text-xs text-ink-soft">{Math.round(percent)}%</p>
      </div>
      <div className="h-2 w-full rounded-full bg-line overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="font-display text-lg text-ink mt-3">{steps[currentStep]}</p>
    </div>
  )
}
