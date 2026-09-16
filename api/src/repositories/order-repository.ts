import type { Order } from '../domain/order.js'

export interface OrderRepository {
  save(order: Order): Promise<void>
  findById(id: string): Promise<Order | undefined>
  findAll(): Promise<Order[]>
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>()

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, structuredClone(order))
  }

  async findById(id: string): Promise<Order | undefined> {
    const order = this.orders.get(id)
    return order ? structuredClone(order) : undefined
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders.values()].map((order) => structuredClone(order))
  }
}
