import { ValidationError } from '../../domain/errors.js'
import type { CheckoutItemInput } from '../../domain/checkout-service.js'

export const MESSAGES = {
  invalidProduct: 'Informe um produto válido para concluir a compra.',
  invalidQuantity: 'A quantidade deve ser um número inteiro maior ou igual a 1.',
  invalidIdempotencyKey: 'Informe o header Idempotency-Key com um UUID válido.',
  invalidJson: 'Corpo da requisição inválido. Envie um JSON válido.',
} as const

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseCheckoutBody(body: unknown): CheckoutItemInput[] {
  if (!isRecord(body) || !Array.isArray(body.items) || body.items.length === 0) {
    throw new ValidationError(MESSAGES.invalidProduct, { field: 'items' })
  }

  return body.items.map((raw: unknown, index: number): CheckoutItemInput => {
    if (!isRecord(raw)) {
      throw new ValidationError(MESSAGES.invalidProduct, { field: `items[${index}]` })
    }

    const { productId, quantity } = raw

    if (typeof productId !== 'string' || productId.trim() === '') {
      throw new ValidationError(MESSAGES.invalidProduct, { field: `items[${index}].productId` })
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationError(MESSAGES.invalidQuantity, { field: `items[${index}].quantity` })
    }

    return { productId: productId.trim(), quantity }
  })
}

export function parseIdempotencyKey(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header

  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    throw new ValidationError(MESSAGES.invalidIdempotencyKey, { header: 'Idempotency-Key' })
  }

  return value.trim().toLowerCase()
}
