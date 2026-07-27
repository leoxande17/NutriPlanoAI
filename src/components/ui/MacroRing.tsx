// Elemento de assinatura visual do NutriPlano AI: um anel de macronutrientes,
// remetendo ao rótulo nutricional que a IA vai gerar para o usuário.
interface MacroRingProps {
  protein?: number // %
  carbs?: number   // %
  fat?: number      // %
  size?: number
  className?: string
}

export function MacroRing({
  protein = 35,
  carbs = 40,
  fat = 25,
  size = 220,
  className = '',
}: MacroRingProps) {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const proteinLen = (protein / 100) * circumference
  const carbsLen = (carbs / 100) * circumference
  const fatLen = (fat / 100) * circumference

  const proteinOffset = 0
  const carbsOffset = -proteinLen
  const fatOffset = -(proteinLen + carbsLen)

  return (
    <svg
      viewBox="0 0 220 220"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Distribuição de macronutrientes: ${protein}% proteína, ${carbs}% carboidrato, ${fat}% gordura`}
    >
      <circle cx="110" cy="110" r={radius} fill="none" stroke="#DDE4DC" strokeWidth="18" />
      <circle
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke="#1F4D3A"
        strokeWidth="18"
        strokeDasharray={`${proteinLen} ${circumference}`}
        strokeDashoffset={proteinOffset}
        strokeLinecap="butt"
        transform="rotate(-90 110 110)"
      />
      <circle
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke="#F4B942"
        strokeWidth="18"
        strokeDasharray={`${carbsLen} ${circumference}`}
        strokeDashoffset={carbsOffset}
        strokeLinecap="butt"
        transform="rotate(-90 110 110)"
      />
      <circle
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke="#FF6B4A"
        strokeWidth="18"
        strokeDasharray={`${fatLen} ${circumference}`}
        strokeDashoffset={fatOffset}
        strokeLinecap="butt"
        transform="rotate(-90 110 110)"
      />
      <text x="110" y="104" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="22" fill="#16231C">
        Seu
      </text>
      <text x="110" y="128" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="22" fill="#16231C">
        plano
      </text>
    </svg>
  )
}
