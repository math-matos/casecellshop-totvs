import { createHash, randomUUID } from 'node:crypto'
import {
  IdempotencyKeyReusedError,
  IdempotencyRequestInProgressError,
  ProductNotFoundError,
} from './errors.js'
import type { Order, OrderItem } from './order.js'
import type { Product } from './product.js'
import type { IdempotencyStore } from '../repositories/idempotency-store.js'
import type { OrderRepository } from '../repositories/order-repository.js'
import type { ProductRepository } from '../repositories/product-repository.js'

export interface CheckoutItemInput {
  productId: string
  quantity: number
}

export interface CheckoutInput {
  idempotencyKey: string
  items: CheckoutItemInput[]
}

export interface CheckoutResult {
  order: Order
  replayed: boolean
}

export interface CheckoutServiceDependencies {
  productRepository: ProductRepository
  orderRepository: OrderRepository
  idempotencyStore: IdempotencyStore
}

export class CheckoutService {
  constructor(private readonly deps: CheckoutServiceDependencies) {}

  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    const items = mergeDuplicateItems(input.items)
    const requestHash = hashItems(items)
    const { idempotencyStore } = this.deps

    const claim = await idempotencyStore.claim(input.idempotencyKey, requestHash)

    if (claim.kind === 'in_progress') {
      throw new IdempotencyRequestInProgressError(input.idempotencyKey)
    }

    if (claim.kind === 'completed') {
      if (claim.requestHash !== requestHash) {
        throw new IdempotencyKeyReusedError(input.idempotencyKey)
      }
      const order = await this.deps.orderRepository.findById(claim.orderId)
      if (order) return { order, replayed: true }
      await idempotencyStore.release(input.idempotencyKey)
      await idempotencyStore.claim(input.idempotencyKey, requestHash)
    }

    try {
      const order = await this.createOrder(items)
      await idempotencyStore.complete(input.idempotencyKey, order.id)
      return { order, replayed: false }
    } catch (error) {
      await idempotencyStore.release(input.idempotencyKey)
      throw error
    }
  }

  private async createOrder(items: CheckoutItemInput[]): Promise<Order> {
    const { productRepository, orderRepository } = this.deps

    const products = new Map<string, Product>()
    for (const item of items) {
      const product = await productRepository.findById(item.productId)
      if (!product) throw new ProductNotFoundError(item.productId)
      products.set(product.id, product)
    }

    await productRepository.reserveStock(items)

    const orderItems: OrderItem[] = items.map((item) => {
      const product = products.get(item.productId)!
      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPriceInCents: product.priceInCents,
        subtotalInCents: product.priceInCents * item.quantity,
      }
    })

    const order: Order = {
      id: randomUUID(),
      status: 'CONFIRMED',
      items: orderItems,
      totalInCents: orderItems.reduce((sum, item) => sum + item.subtotalInCents, 0),
      createdAt: new Date().toISOString(),
    }

    await orderRepository.save(order)
    return order
  }
}

function mergeDuplicateItems(items: CheckoutItemInput[]): CheckoutItemInput[] {
  const merged = new Map<string, number>()
  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity)
  }
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }))
}

function hashItems(items: CheckoutItemInput[]): string {
  const normalized = [...items].sort((a, b) => a.productId.localeCompare(b.productId))
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}
