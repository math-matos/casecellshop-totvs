import type { Category } from '../api/types'

/**
 * Ilustração do produto.
 *
 * A API não guarda imagens, então cada produto é desenhado em SVG a partir do seu id
 * (com fallback por categoria). Mantém o app sem dependência de arquivos binários
 * e sem quebrar quando o catálogo ganha um item novo.
 */
type Art = (props: { title: string }) => React.ReactElement

/** Traseira da capinha: corpo na cor da categoria e módulo de câmera em destaque. */
const phoneCase: Art = ({ title }) => (
  <svg viewBox="0 0 96 96" role="img" aria-label={title}>
    <rect x="29" y="11" width="38" height="74" rx="11" className="art-body" />
    <path d="M29 62 L67 30 v44 a11 11 0 0 1 -11 11 H40 a11 11 0 0 1 -11 -11 Z" className="art-shine" />
    <rect x="35" y="17" width="20" height="18" rx="6" className="art-lens-plate" />
    <circle cx="41" cy="23" r="3.4" className="art-lens" />
    <circle cx="49" cy="23" r="3.4" className="art-lens" />
    <circle cx="41" cy="30" r="3.4" className="art-lens" />
    <rect x="26.5" y="34" width="2.6" height="10" rx="1.3" className="art-detail" />
  </svg>
)

const screenProtector: Art = ({ title }) => (
  <svg viewBox="0 0 96 96" role="img" aria-label={title}>
    <rect x="26" y="14" width="36" height="68" rx="9" className="art-screen" />
    <rect x="34" y="20" width="36" height="68" rx="9" className="art-body" opacity="0.92" />
    <rect x="38" y="24" width="28" height="60" rx="6" className="art-screen" />
    <path d="M38 24 L66 24 L38 74 Z" className="art-shine" />
  </svg>
)

const charger: Art = ({ title }) => (
  <svg viewBox="0 0 96 96" role="img" aria-label={title}>
    <rect x="28" y="26" width="40" height="40" rx="12" className="art-body" />
    <rect x="42" y="14" width="4.5" height="12" rx="2" className="art-detail" />
    <rect x="50" y="14" width="4.5" height="12" rx="2" className="art-detail" />
    <path d="M50 36 L41 49 L47 49 L44 60 L55 45 L49 45 Z" className="art-bolt" />
    <rect x="34" y="70" width="28" height="5" rx="2.5" className="art-detail" opacity="0.5" />
  </svg>
)

const powerBank: Art = ({ title }) => (
  <svg viewBox="0 0 96 96" role="img" aria-label={title}>
    <rect x="28" y="20" width="40" height="56" rx="10" className="art-body" />
    <rect x="34" y="28" width="28" height="12" rx="4" className="art-screen" />
    <rect x="36" y="31" width="16" height="6" rx="2" className="art-bolt" />
    <circle cx="42" cy="56" r="4" className="art-screen" />
    <circle cx="54" cy="56" r="4" className="art-screen" />
  </svg>
)

const cable: Art = ({ title }) => (
  <svg viewBox="0 0 96 96" role="img" aria-label={title}>
    <path
      d="M32 20 v14 c0 14 32 12 32 26 v16"
      className="art-cable"
      fill="none"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <rect x="25" y="12" width="14" height="12" rx="4" className="art-body" />
    <rect x="57" y="72" width="14" height="12" rx="4" className="art-body" />
  </svg>
)

const headphones: Art = ({ title }) => (
  <svg viewBox="0 0 96 96" role="img" aria-label={title}>
    <path
      d="M24 56 V48 a24 24 0 0 1 48 0 v8"
      className="art-cable"
      fill="none"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <rect x="16" y="50" width="16" height="26" rx="8" className="art-body" />
    <rect x="64" y="50" width="16" height="26" rx="8" className="art-body" />
  </svg>
)

const earbuds: Art = ({ title }) => (
  <svg viewBox="0 0 96 96" role="img" aria-label={title}>
    <rect x="26" y="30" width="44" height="34" rx="12" className="art-screen" />
    <path d="M36 26 a7 7 0 0 1 14 0 v20 a7 7 0 0 1 -14 0 Z" className="art-body" />
    <path d="M52 26 a7 7 0 0 1 14 0 v20 a7 7 0 0 1 -14 0 Z" className="art-body" />
    <rect x="34" y="68" width="28" height="4" rx="2" className="art-detail" opacity="0.4" />
  </svg>
)

const mount: Art = ({ title }) => (
  <svg viewBox="0 0 96 96" role="img" aria-label={title}>
    <rect x="32" y="16" width="32" height="46" rx="8" className="art-body" />
    <circle cx="48" cy="39" r="9" className="art-screen" />
    <circle cx="48" cy="39" r="4" className="art-bolt" />
    <path d="M48 62 v10" className="art-cable" strokeWidth="6" strokeLinecap="round" />
    <rect x="34" y="72" width="28" height="8" rx="4" className="art-body" />
  </svg>
)

const BY_ID: Record<string, Art> = {
  'powerbank-10000mah': powerBank,
  'cabo-usbc-2m': cable,
  'fone-bluetooth-tws': earbuds,
  'fone-intra-auricular': headphones,
  'suporte-veicular-magnetico': mount,
}

const BY_CATEGORY: Record<Category, Art> = {
  capinhas: phoneCase,
  peliculas: screenProtector,
  carregadores: charger,
  audio: headphones,
}

interface ProductImageProps {
  productId: string
  category: Category
  name: string
  variant?: 'card' | 'thumb'
}

export function ProductImage({ productId, category, name, variant = 'card' }: ProductImageProps) {
  const Art = BY_ID[productId] ?? BY_CATEGORY[category]

  return (
    <div className={`product-art product-art--${variant}`} data-category={category}>
      <Art title={name} />
    </div>
  )
}
