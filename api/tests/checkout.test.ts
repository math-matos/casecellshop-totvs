import { randomUUID } from 'node:crypto'
import { describe, expect, test } from 'vitest'
import { InMemoryOrderRepository } from '../src/repositories/order-repository.js'
import {
  InMemoryProductRepository,
  type ProductRepository,
} from '../src/repositories/product-repository.js'
import { getStock, makeApp, postCheckout, PRODUCTS } from './helpers.js'

describe('POST /checkout', () => {
  describe('sucesso', () => {
    test('compra válida cria o pedido com preço calculado pelo backend e baixa o estoque', async () => {
      const app = makeApp()

      const res = await postCheckout(app, {
        items: [
          { productId: 'capinha-preta', quantity: 2 },
          { productId: 'pelicula-vidro-3d', quantity: 1 },
        ],
        headers: { 'x-correlation-id': 'compra-001' },
      })

      expect(res.statusCode).toBe(201)
      expect(res.headers['idempotent-replayed']).toBe('false')
      expect(res.headers['x-correlation-id']).toBe('compra-001')

      const body = res.json()
      expect(body).toMatchObject({
        status: 'CONFIRMED',
        totalInCents: 4990 * 2 + 2990,
        items: [
          {
            productId: 'capinha-preta',
            name: 'Capinha Preta',
            quantity: 2,
            unitPriceInCents: 4990,
            subtotalInCents: 9980,
          },
          {
            productId: 'pelicula-vidro-3d',
            name: 'Película de Vidro 3D',
            quantity: 1,
            unitPriceInCents: 2990,
            subtotalInCents: 2990,
          },
        ],
      })
      expect(body.orderId).toMatch(/^[0-9a-f-]{36}$/)
      expect(new Date(body.createdAt).toString()).not.toBe('Invalid Date')

      expect(await getStock(app, 'capinha-preta')).toBe(8)
      expect(await getStock(app, 'pelicula-vidro-3d')).toBe(0)
    })

    test('ignora preço enviado pelo cliente', async () => {
      const app = makeApp()

      const res = await postCheckout(app, {
        items: [
          { productId: 'capinha-preta', quantity: 1, unitPriceInCents: 1 },
        ],
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().totalInCents).toBe(4990)
    })

    test('soma quantidades quando o mesmo produto aparece mais de uma vez', async () => {
      const app = makeApp()

      const res = await postCheckout(app, {
        items: [
          { productId: 'capinha-preta', quantity: 1 },
          { productId: 'capinha-preta', quantity: 2 },
        ],
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().items).toHaveLength(1)
      expect(res.json().items[0].quantity).toBe(3)
      expect(await getStock(app, 'capinha-preta')).toBe(7)
    })
  })

  describe('400 - entradas inválidas', () => {
    test.each([
      ['quantidade zero', 0],
      ['quantidade negativa', -1],
      ['quantidade não inteira', 1.5],
      ['quantidade como string', '1'],
    ])('%s', async (_label, quantity) => {
      const app = makeApp()
      const res = await postCheckout(app, {
        items: [{ productId: 'capinha-preta', quantity }],
      })

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'A quantidade deve ser um número inteiro maior ou igual a 1.',
      })
      expect(await getStock(app, 'capinha-preta')).toBe(10)
    })

    test.each([
      ['sem items', {}],
      ['items vazio', { items: [] }],
      ['productId ausente', { items: [{ quantity: 1 }] }],
      ['productId vazio', { items: [{ productId: '', quantity: 1 }] }],
    ])('%s', async (_label, body) => {
      const app = makeApp()
      const res = await postCheckout(app, { body })

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Informe um produto válido para concluir a compra.',
      })
    })

    test('JSON malformado', async () => {
      const app = makeApp()
      const res = await app.inject({
        method: 'POST',
        url: '/checkout',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': randomUUID(),
        },
        payload: '{"items": [',
      })

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ code: 'VALIDATION_ERROR' })
    })

    test('Idempotency-Key ausente', async () => {
      const app = makeApp()
      const res = await postCheckout(app, {
        items: [{ productId: 'capinha-preta', quantity: 1 }],
        idempotencyKey: null,
      })

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Informe o header Idempotency-Key com um UUID válido.',
      })
    })

    test('Idempotency-Key que não é UUID', async () => {
      const app = makeApp()
      const res = await postCheckout(app, {
        items: [{ productId: 'capinha-preta', quantity: 1 }],
        idempotencyKey: 'pedido-123',
      })

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ code: 'VALIDATION_ERROR' })
    })
  })

  describe('404 - produto inexistente', () => {
    test('retorna PRODUCT_NOT_FOUND e não altera estoque de outros itens', async () => {
      const app = makeApp()
      const res = await postCheckout(app, {
        items: [
          { productId: 'capinha-preta', quantity: 1 },
          { productId: 'capinha-roxa', quantity: 1 },
        ],
      })

      expect(res.statusCode).toBe(404)
      expect(res.json()).toEqual({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produto não encontrado.',
        details: { productId: 'capinha-roxa' },
      })
      expect(await getStock(app, 'capinha-preta')).toBe(10)
    })
  })

  describe('409 - estoque insuficiente', () => {
    test('produto esgotado', async () => {
      const app = makeApp()
      const res = await postCheckout(app, {
        items: [{ productId: 'capinha-verde', quantity: 1 }],
      })

      expect(res.statusCode).toBe(409)
      expect(res.json()).toEqual({
        code: 'INSUFFICIENT_STOCK',
        message: 'Capinha Verde está esgotado no momento.',
        details: { productId: 'capinha-verde', requested: 1, available: 0 },
      })
    })

    test('quantidade maior que o estoque disponível', async () => {
      const app = makeApp()
      const res = await postCheckout(app, {
        items: [{ productId: 'capinha-preta', quantity: 11 }],
      })

      expect(res.statusCode).toBe(409)
      expect(res.json()).toMatchObject({
        code: 'INSUFFICIENT_STOCK',
        message: 'Capinha Preta possui apenas 10 unidade(s) em estoque.',
        details: { requested: 11, available: 10 },
      })
      expect(await getStock(app, 'capinha-preta')).toBe(10)
    })

    test('reserva é tudo ou nada: item sem estoque cancela a baixa dos demais', async () => {
      const app = makeApp()
      const res = await postCheckout(app, {
        items: [
          { productId: 'capinha-preta', quantity: 1 },
          { productId: 'pelicula-vidro-3d', quantity: 2 },
        ],
      })

      expect(res.statusCode).toBe(409)
      expect(await getStock(app, 'capinha-preta')).toBe(10)
      expect(await getStock(app, 'pelicula-vidro-3d')).toBe(1)
    })

    test('race condition: 10 compras simultâneas de um produto com 1 unidade geram 1 pedido', async () => {
      const app = makeApp()

      const responses = await Promise.all(
        Array.from({ length: 10 }, () =>
          postCheckout(app, {
            items: [{ productId: 'pelicula-vidro-3d', quantity: 1 }],
          }),
        ),
      )

      const statuses = responses.map((res) => res.statusCode)
      expect(statuses.filter((status) => status === 201)).toHaveLength(1)
      expect(statuses.filter((status) => status === 409)).toHaveLength(9)
      expect(await getStock(app, 'pelicula-vidro-3d')).toBe(0)
    })
  })

  describe('idempotência', () => {
    test('retry com a mesma Idempotency-Key devolve o mesmo pedido sem baixar estoque de novo', async () => {
      const app = makeApp()
      const idempotencyKey = randomUUID()
      const items = [{ productId: 'capinha-preta', quantity: 2 }]

      const first = await postCheckout(app, { items, idempotencyKey })
      const second = await postCheckout(app, { items, idempotencyKey })

      expect(first.statusCode).toBe(201)
      expect(second.statusCode).toBe(201)
      expect(second.json()).toEqual(first.json())
      expect(first.headers['idempotent-replayed']).toBe('false')
      expect(second.headers['idempotent-replayed']).toBe('true')
      expect(await getStock(app, 'capinha-preta')).toBe(8)
    })

    test('mesma chave com payload diferente é rejeitada com 422', async () => {
      const app = makeApp()
      const idempotencyKey = randomUUID()

      await postCheckout(app, {
        items: [{ productId: 'capinha-preta', quantity: 1 }],
        idempotencyKey,
      })
      const res = await postCheckout(app, {
        items: [{ productId: 'capinha-preta', quantity: 5 }],
        idempotencyKey,
      })

      expect(res.statusCode).toBe(422)
      expect(res.json()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' })
      expect(await getStock(app, 'capinha-preta')).toBe(9)
    })

    test('chamadas concorrentes com a mesma chave criam apenas um pedido', async () => {
      const orderRepository = new InMemoryOrderRepository()
      const app = makeApp({ orderRepository })
      const idempotencyKey = randomUUID()
      const items = [{ productId: 'capinha-preta', quantity: 1 }]

      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          postCheckout(app, { items, idempotencyKey }),
        ),
      )

      for (const res of responses) {
        expect([201, 409]).toContain(res.statusCode)
        if (res.statusCode === 409) {
          expect(res.json()).toMatchObject({
            code: 'IDEMPOTENCY_REQUEST_IN_PROGRESS',
          })
        }
      }
      expect(responses.some((res) => res.statusCode === 201)).toBe(true)
      expect(await orderRepository.findAll()).toHaveLength(1)
      expect(await getStock(app, 'capinha-preta')).toBe(9)
    })

    test('falha (409) não consome a chave: retry após reposição de estoque funciona', async () => {
      let inner = new InMemoryProductRepository(PRODUCTS)
      const swappable: ProductRepository = {
        findById: (id) => inner.findById(id),
        findAll: () => inner.findAll(),
        reserveStock: (reservations) => inner.reserveStock(reservations),
      }
      const app = makeApp({ productRepository: swappable })
      const idempotencyKey = randomUUID()
      const items = [{ productId: 'capinha-verde', quantity: 1 }]

      const failed = await postCheckout(app, { items, idempotencyKey })
      expect(failed.statusCode).toBe(409)

      inner = new InMemoryProductRepository([
        {
          id: 'capinha-verde',
          name: 'Capinha Verde',
          priceInCents: 4990,
          stock: 5,
          category: 'capinhas',
          compareAtPriceInCents: 5990,
        },
      ])

      const retried = await postCheckout(app, { items, idempotencyKey })
      expect(retried.statusCode).toBe(201)
      expect(retried.headers['idempotent-replayed']).toBe('false')
    })
  })

  describe('500 - erro inesperado', () => {
    test('falha interna retorna SERVER_ERROR sem vazar detalhes', async () => {
      const failing: ProductRepository = {
        findById: async () => {
          throw new Error('conexão com o banco caiu')
        },
        findAll: async () => [],
        reserveStock: async () => {},
      }
      const app = makeApp({ productRepository: failing })

      const res = await postCheckout(app, {
        items: [{ productId: 'capinha-preta', quantity: 1 }],
      })

      expect(res.statusCode).toBe(500)
      expect(res.json()).toEqual({
        code: 'SERVER_ERROR',
        message: 'Erro de servidor inesperado.',
      })
      expect(res.body).not.toContain('conexão com o banco')
    })

    test('falha interna libera a Idempotency-Key para um novo retry', async () => {
      let shouldFail = true
      const real = new InMemoryProductRepository(PRODUCTS)
      const flaky: ProductRepository = {
        findById: async (id) => {
          if (shouldFail) throw new Error('timeout')
          return real.findById(id)
        },
        findAll: () => real.findAll(),
        reserveStock: (reservations) => real.reserveStock(reservations),
      }
      const app = makeApp({ productRepository: flaky })
      const idempotencyKey = randomUUID()
      const items = [{ productId: 'capinha-preta', quantity: 1 }]

      expect(
        (await postCheckout(app, { items, idempotencyKey })).statusCode,
      ).toBe(500)

      shouldFail = false
      const retried = await postCheckout(app, { items, idempotencyKey })
      expect(retried.statusCode).toBe(201)
    })
  })
})
