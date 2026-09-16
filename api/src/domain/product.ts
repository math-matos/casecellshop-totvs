export interface Product {
  id: string
  name: string
  priceInCents: number
  stock: number
}

export const catalogSeed: readonly Product[] = [
  { id: 'capinha-verde', name: 'Capinha Verde', priceInCents: 4990, stock: 0 },
  { id: 'capinha-preta', name: 'Capinha Preta', priceInCents: 4990, stock: 12 },
  { id: 'capinha-transparente', name: 'Capinha Transparente', priceInCents: 3990, stock: 5 },
  { id: 'pelicula-vidro-3d', name: 'Película de Vidro 3D', priceInCents: 2990, stock: 30 },
  { id: 'carregador-turbo-20w', name: 'Carregador Turbo 20W', priceInCents: 8990, stock: 3 },
]
