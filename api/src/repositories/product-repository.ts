import { InsufficientStockError, ProductNotFoundError } from '../domain/errors.js'
import { catalogSeed, type Product } from '../domain/product.js'

export interface StockReservation {
  productId: string
  quantity: number
}

export interface ProductRepository {
  findById(id: string): Promise<Product | undefined>
  findAll(): Promise<Product[]>
  reserveStock(reservations: StockReservation[]): Promise<void>
}

export class InMemoryProductRepository implements ProductRepository {
  private readonly products = new Map<string, Product>()

  constructor(seed: readonly Product[] = catalogSeed) {
    for (const product of seed) {
      this.products.set(product.id, { ...product })
    }
  }

  async findById(id: string): Promise<Product | undefined> {
    const product = this.products.get(id)
    return product ? { ...product } : undefined
  }

  async findAll(): Promise<Product[]> {
    return [...this.products.values()].map((product) => ({ ...product }))
  }

  async reserveStock(reservations: StockReservation[]): Promise<void> {
    for (const { productId, quantity } of reservations) {
      const product = this.products.get(productId)
      if (!product) throw new ProductNotFoundError(productId)
      if (product.stock < quantity) {
        throw new InsufficientStockError(product, quantity, product.stock)
      }
    }

    for (const { productId, quantity } of reservations) {
      this.products.get(productId)!.stock -= quantity
    }
  }
}
