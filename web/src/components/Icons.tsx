/** Ícones de UI em SVG inline, herdando a cor do texto (currentColor). */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

interface IconProps {
  /** Tamanho/estilo do ícone. Padrão 18px, sobrescrito pelo contexto. */
  className?: string
}

const DEFAULT = 'size-[18px] shrink-0'

export function PlusIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function MinusIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function TrashIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function TagIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
      <path d="M9 15l6-6M9.5 9.5h.01M14.5 14.5h.01" />
    </svg>
  )
}

export function CheckIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export function AlertIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}

export function CartIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </svg>
  )
}
