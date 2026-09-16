import { useState } from 'react'
import type { Product } from '../api/types'
import type { CheckoutItemInput } from '../api/client'
import type { OrderLine } from '../components/OrderSummary'

/** Carrinho: id do produto -> quantidade. Mantido fora do componente para facilitar os testes. */
export type CartState = Record<string, number>

export interface Cart {
  lines: OrderLine[]
  items: CheckoutItemInput[]
  totalInCents: number
  savingsInCents: number
  quantityOf: (productId: string) => number
  add: (product: Product) => void
  increase: (productId: string, max: number) => void
  decrease: (productId: string) => void
  remove: (productId: string) => void
  clear: () => void
}

/**
 * Regras do carrinho no cliente:
 * - nunca passa do estoque conhecido (a API valida de novo, isso é só para a UX);
 * - chegar a zero remove o item;
 * - totais são derivados dos preços vindos da API, nunca digitados aqui.
 */
export function useCart(products: Product[]): Cart {
  const [state, setState] = useState<CartState>({})

  const byId = new Map(products.map((product) => [product.id, product]))

  const quantityOf = (productId: string) => state[productId] ?? 0

  const add = (product: Product) => {
    if (product.stock < 1) return
    setState((current) => ({ ...current, [product.id]: Math.min(1, product.stock) }))
  }

  const increase = (productId: string, max: number) => {
    setState((current) => {
      const next = Math.min((current[productId] ?? 0) + 1, max)
      return next === current[productId] ? current : { ...current, [productId]: next }
    })
  }

  const remove = (productId: string) => {
    setState((current) => {
      if (!(productId in current)) return current
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  const decrease = (productId: string) => {
    setState((current) => {
      const quantity = (current[productId] ?? 0) - 1

      if (quantity < 1) {
        const next = { ...current }
        delete next[productId]
        return next
      }

      return { ...current, [productId]: quantity }
    })
  }

  const clear = () => setState({})

  const lines: OrderLine[] = Object.entries(state)
    .map(([productId, quantity]) => {
      const product = byId.get(productId)
      return product ? { product, quantity } : null
    })
    .filter((line): line is OrderLine => line !== null)

  const items: CheckoutItemInput[] = lines.map(({ product, quantity }) => ({
    productId: product.id,
    quantity,
  }))

  const totalInCents = lines.reduce((sum, { product, quantity }) => sum + product.priceInCents * quantity, 0)

  const savingsInCents = lines.reduce((sum, { product, quantity }) => {
    const was = product.compareAtPriceInCents ?? product.priceInCents
    return sum + Math.max(0, was - product.priceInCents) * quantity
  }, 0)

  return {
    lines,
    items,
    totalInCents,
    savingsInCents,
    quantityOf,
    add,
    increase,
    decrease,
    remove,
    clear,
  }
}
