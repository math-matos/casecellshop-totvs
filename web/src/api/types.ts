/** Tipos espelhando o contrato da API (ver README na raiz do repositório). */

export type Category = 'capinhas' | 'peliculas' | 'carregadores' | 'audio'

export interface Product {
  id: string
  name: string
  category: Category
  priceInCents: number
  compareAtPriceInCents?: number
  stock: number
}

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  unitPriceInCents: number
  subtotalInCents: number
}

export interface Order {
  orderId: string
  status: 'CONFIRMED'
  items: OrderItem[]
  totalInCents: number
  createdAt: string
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'IDEMPOTENCY_REQUEST_IN_PROGRESS'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'

/** Erro devolvido pela API, já normalizado para a UI consumir. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details?: Record<string, unknown>

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** Id do produto que causou o erro, quando a API informa. Usado para destacar o card. */
  get productId(): string | undefined {
    const value = this.details?.productId
    return typeof value === 'string' ? value : undefined
  }
}
