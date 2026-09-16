/**
 * Representação simples de produto e estoque.
 *
 * Preço em centavos (inteiro) para evitar erros de arredondamento com ponto flutuante.
 */
export const CATEGORIES = ['capinhas', 'peliculas', 'carregadores', 'audio'] as const

export type Category = (typeof CATEGORIES)[number]

export interface Product {
  id: string
  name: string
  category: Category
  priceInCents: number
  /** Preço "de", exibido riscado na vitrine. Ausente quando não há promoção. */
  compareAtPriceInCents?: number
  stock: number
}

/** Catálogo inicial carregado em memória quando a API sobe. */
export const catalogSeed: readonly Product[] = [
  {
    id: 'capinha-verde',
    name: 'Capinha Verde',
    category: 'capinhas',
    priceInCents: 4990,
    compareAtPriceInCents: 6990,
    stock: 0,
  },
  {
    id: 'capinha-preta',
    name: 'Capinha Preta',
    category: 'capinhas',
    priceInCents: 4990,
    compareAtPriceInCents: 6990,
    stock: 12,
  },
  {
    id: 'capinha-transparente',
    name: 'Capinha Transparente',
    category: 'capinhas',
    priceInCents: 3990,
    stock: 5,
  },
  {
    id: 'capinha-couro-magsafe',
    name: 'Capinha de Couro MagSafe',
    category: 'capinhas',
    priceInCents: 12990,
    compareAtPriceInCents: 15990,
    stock: 7,
  },
  {
    id: 'pelicula-vidro-3d',
    name: 'Película de Vidro 3D',
    category: 'peliculas',
    priceInCents: 2990,
    compareAtPriceInCents: 3990,
    stock: 30,
  },
  {
    id: 'pelicula-privacidade',
    name: 'Película de Privacidade',
    category: 'peliculas',
    priceInCents: 4490,
    stock: 18,
  },
  {
    id: 'carregador-turbo-20w',
    name: 'Carregador Turbo 20W',
    category: 'carregadores',
    priceInCents: 8990,
    compareAtPriceInCents: 10990,
    stock: 3,
  },
  {
    id: 'powerbank-10000mah',
    name: 'Power Bank 10.000mAh',
    category: 'carregadores',
    priceInCents: 15990,
    compareAtPriceInCents: 19990,
    stock: 9,
  },
  {
    id: 'cabo-usbc-2m',
    name: 'Cabo USB-C 2m',
    category: 'carregadores',
    priceInCents: 3990,
    stock: 42,
  },
  {
    id: 'fone-bluetooth-tws',
    name: 'Fone Bluetooth TWS',
    category: 'audio',
    priceInCents: 19990,
    compareAtPriceInCents: 24990,
    stock: 14,
  },
  {
    id: 'fone-intra-auricular',
    name: 'Fone Intra-auricular P2',
    category: 'audio',
    priceInCents: 5990,
    stock: 1,
  },
  {
    id: 'suporte-veicular-magnetico',
    name: 'Suporte Veicular Magnético',
    category: 'carregadores',
    priceInCents: 6990,
    compareAtPriceInCents: 8990,
    stock: 11,
  },
]
