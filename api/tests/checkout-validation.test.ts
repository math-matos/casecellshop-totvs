import { describe, expect, test } from 'vitest'
import { ValidationError } from '../src/domain/errors.js'
import {
  MESSAGES,
  parseCheckoutBody,
  parseIdempotencyKey,
} from '../src/http/validation/checkout-request.js'

describe('parseCheckoutBody', () => {
  test('aceita um body válido e normaliza o productId', () => {
    const items = parseCheckoutBody({
      items: [{ productId: '  capinha-preta ', quantity: 2 }],
    })

    expect(items).toEqual([{ productId: 'capinha-preta', quantity: 2 }])
  })

  test.each([
    ['body vazio', undefined],
    ['body nulo', null],
    ['body que não é objeto', 'texto'],
    ['sem items', {}],
    ['items que não é array', { items: { productId: 'x', quantity: 1 } }],
    ['items vazio', { items: [] }],
    ['item que não é objeto', { items: ['capinha-preta'] }],
    ['productId ausente', { items: [{ quantity: 1 }] }],
    ['productId vazio', { items: [{ productId: '   ', quantity: 1 }] }],
    ['productId numérico', { items: [{ productId: 123, quantity: 1 }] }],
  ])('rejeita produto inválido: %s', (_label, body) => {
    expect(() => parseCheckoutBody(body)).toThrowError(
      expect.objectContaining({ message: MESSAGES.invalidProduct, statusCode: 400 }),
    )
  })

  test.each([
    ['quantidade zero', 0],
    ['quantidade negativa', -3],
    ['quantidade não inteira', 1.5],
    ['quantidade como string', '2'],
    ['quantidade ausente', undefined],
    ['quantidade NaN', Number.NaN],
    ['quantidade infinita', Number.POSITIVE_INFINITY],
  ])('rejeita quantidade inválida: %s', (_label, quantity) => {
    expect(() => parseCheckoutBody({ items: [{ productId: 'capinha-preta', quantity }] })).toThrowError(
      expect.objectContaining({ message: MESSAGES.invalidQuantity, statusCode: 400 }),
    )
  })

  test('informa o campo com problema em details', () => {
    try {
      parseCheckoutBody({ items: [{ productId: 'a', quantity: 1 }, { productId: 'b', quantity: 0 }] })
      expect.unreachable('deveria lançar')
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect((error as ValidationError).details).toEqual({ field: 'items[1].quantity' })
    }
  })
})

describe('parseIdempotencyKey', () => {
  test('aceita UUID e normaliza para minúsculas', () => {
    expect(parseIdempotencyKey('3F2504E0-4F89-41D3-9A0C-0305E82C3301')).toBe(
      '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    )
  })

  test.each([
    ['ausente', undefined],
    ['vazio', ''],
    ['não é UUID', 'pedido-1'],
    ['UUID incompleto', '3f2504e0-4f89-41d3-9a0c'],
  ])('rejeita header inválido: %s', (_label, header) => {
    expect(() => parseIdempotencyKey(header)).toThrowError(
      expect.objectContaining({ message: MESSAGES.invalidIdempotencyKey, statusCode: 400 }),
    )
  })
})
