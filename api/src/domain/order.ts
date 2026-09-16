export interface OrderItem {
  productId: string
  name: string
  quantity: number
  unitPriceInCents: number
  subtotalInCents: number
}

export interface Order {
  id: string
  status: 'CONFIRMED'
  items: OrderItem[]
  totalInCents: number
  createdAt: string
}
