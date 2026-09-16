export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'IDEMPOTENCY_REQUEST_IN_PROGRESS'
  | 'SERVER_ERROR'

export interface ErrorResponse {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = new.target.name
  }

  toResponse(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'VALIDATION_ERROR', message, details)
  }
}

export class ProductNotFoundError extends AppError {
  constructor(productId: string) {
    super(404, 'PRODUCT_NOT_FOUND', 'Produto não encontrado.', { productId })
  }
}

export class InsufficientStockError extends AppError {
  constructor(product: { id: string; name: string }, requested: number, available: number) {
    const message =
      available === 0
        ? `${product.name} está esgotado no momento.`
        : `${product.name} possui apenas ${available} unidade(s) em estoque.`

    super(409, 'INSUFFICIENT_STOCK', message, {
      productId: product.id,
      requested,
      available,
    })
  }
}

export class IdempotencyKeyReusedError extends AppError {
  constructor(idempotencyKey: string) {
    super(
      422,
      'IDEMPOTENCY_KEY_REUSED',
      'A chave Idempotency-Key já foi utilizada com um payload diferente.',
      { idempotencyKey },
    )
  }
}

export class IdempotencyRequestInProgressError extends AppError {
  constructor(idempotencyKey: string) {
    super(
      409,
      'IDEMPOTENCY_REQUEST_IN_PROGRESS',
      'Já existe uma requisição em andamento com esta Idempotency-Key.',
      { idempotencyKey },
    )
  }
}
