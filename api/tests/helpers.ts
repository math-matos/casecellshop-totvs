import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { buildApp, type AppOptions } from '../src/app.js'
import type { Product } from '../src/domain/product.js'
import { InMemoryProductRepository } from '../src/repositories/product-repository.js'

export const PRODUCTS: readonly Product[] = [
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
    stock: 10,
  },
  {
    id: 'pelicula-vidro-3d',
    name: 'Película de Vidro 3D',
    category: 'peliculas',
    priceInCents: 2990,
    stock: 1,
  },
]

/** Cria uma app isolada com o catálogo de teste (estado novo a cada chamada). */
export function makeApp(options: AppOptions = {}): FastifyInstance {
  return buildApp({
    productRepository: new InMemoryProductRepository(PRODUCTS),
    ...options,
  })
}

export interface CheckoutCall {
  items?: unknown
  body?: unknown
  idempotencyKey?: string | null
  headers?: Record<string, string>
}

/** Faz um POST /checkout com defaults sensatos (chave nova, body JSON). */
export function postCheckout(app: FastifyInstance, call: CheckoutCall = {}) {
  const headers: Record<string, string> = { ...call.headers }

  if (call.idempotencyKey !== null) {
    headers['idempotency-key'] = call.idempotencyKey ?? randomUUID()
  }

  const payload = call.body !== undefined ? call.body : { items: call.items ?? [] }

  return app.inject({
    method: 'POST',
    url: '/checkout',
    headers,
    payload: payload as Record<string, unknown>,
  })
}

export async function getStock(app: FastifyInstance, productId: string): Promise<number> {
  const res = await app.inject({ method: 'GET', url: '/products' })
  const { products } = res.json<{ products: Product[] }>()
  const product = products.find((p) => p.id === productId)
  if (!product) throw new Error(`Produto ${productId} não existe no catálogo de teste`)
  return product.stock
}
