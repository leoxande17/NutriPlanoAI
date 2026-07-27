import type { ReactNode } from 'react'
import { MacroRing } from '../ui/MacroRing'

export function AuthLayout({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: ReactNode
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-paper">
      {/* Painel de marca — some em telas pequenas */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-white p-12 relative overflow-hidden">
        <div className="relative z-10">
          <span className="font-display text-2xl tracking-tight">NutriPlano AI</span>
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <MacroRing size={200} />
          <div>
            <p className="font-mono-data text-xs uppercase tracking-widest text-white/60 mb-2">
              Anamnese → IA → Plano
            </p>
            <h2 className="font-display text-3xl leading-tight max-w-sm">
              Um plano alimentar pensado para o seu corpo, seu treino e sua rotina.
            </h2>
          </div>
        </div>

        <p className="relative z-10 text-sm text-white/50">
          © {new Date().getFullYear()} NutriPlano AI
        </p>

        {/* Textura sutil de fundo */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Painel do formulário */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display text-2xl text-primary">NutriPlano AI</span>
          </div>

          <p className="font-mono-data text-xs uppercase tracking-widest text-coral mb-2">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl text-ink mb-2">{title}</h1>
          <p className="text-ink-soft text-sm mb-8">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  )
}
