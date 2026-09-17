import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'

/**
 * Integração: contrato HTTP contra a API rodando de verdade (:3000).
 *
 * Complementa os testes em `api/tests` (que usam `app.inject`, em processo):
 * aqui passa pela rede, pelo CORS e pelos headers reais — é o contrato que o
 * `web/src/api/client.ts` consome. Estoque não é resetado entre testes, então
 * cada caso usa um produto próprio e não afirma contagens absolutas de estoque.
 */
const API = 'http://localhost:3000'

test('GET /products devolve o catálogo com Correlation-Id', async ({
  request,
}) => {
  const res = await request.get(`${API}/products`)

  expect(res.status()).toBe(200)
  expect(res.headers()['x-correlation-id']).toMatch(/^[0-9a-f-]{36}$/)

  const { products } = (await res.json()) as {
    products: { id: string; stock: number }[]
  }
  const esgotado = products.find((p) => p.id === 'capinha-verde')
  expect(esgotado?.stock).toBe(0)
})

test('POST /checkout confirma o pedido com total calculado pelo backend', async ({
  request,
}) => {
  const res = await request.post(`${API}/checkout`, {
    headers: { 'Idempotency-Key': randomUUID() },
    // Preço propositalmente errado no corpo: o backend deve ignorá-lo.
    data: {
      items: [
        { productId: 'capinha-transparente', quantity: 1, unitPriceInCents: 1 },
      ],
    },
  })

  expect(res.status()).toBe(201)
  expect(res.headers()['idempotent-replayed']).toBe('false')

  const order = await res.json()
  expect(order.orderId).toMatch(/^[0-9a-f-]{36}$/)
  expect(order.status).toBe('CONFIRMED')
  expect(order.totalInCents).toBe(3990)
})

test('POST /checkout com a mesma Idempotency-Key replica o mesmo pedido', async ({
  request,
}) => {
  const key = randomUUID()
  const data = { items: [{ productId: 'capinha-couro-magsafe', quantity: 1 }] }

  const first = await request.post(`${API}/checkout`, {
    headers: { 'Idempotency-Key': key },
    data,
  })
  const second = await request.post(`${API}/checkout`, {
    headers: { 'Idempotency-Key': key },
    data,
  })

  expect(first.status()).toBe(201)
  expect(second.status()).toBe(201)
  expect(first.headers()['idempotent-replayed']).toBe('false')
  expect(second.headers()['idempotent-replayed']).toBe('true')
  expect(await second.json()).toEqual(await first.json())
})

test('POST /checkout recusa produto esgotado com 409 e detalhes', async ({
  request,
}) => {
  const res = await request.post(`${API}/checkout`, {
    headers: { 'Idempotency-Key': randomUUID() },
    data: { items: [{ productId: 'capinha-verde', quantity: 1 }] },
  })

  expect(res.status()).toBe(409)
  expect(await res.json()).toMatchObject({
    code: 'INSUFFICIENT_STOCK',
    details: { productId: 'capinha-verde', requested: 1, available: 0 },
  })
})

test('POST /checkout sem Idempotency-Key retorna 400', async ({ request }) => {
  const res = await request.post(`${API}/checkout`, {
    data: { items: [{ productId: 'capinha-transparente', quantity: 1 }] },
  })

  expect(res.status()).toBe(400)
  expect(await res.json()).toMatchObject({ code: 'VALIDATION_ERROR' })
})

test('POST /checkout com produto inexistente retorna 404', async ({
  request,
}) => {
  const res = await request.post(`${API}/checkout`, {
    headers: { 'Idempotency-Key': randomUUID() },
    data: { items: [{ productId: 'produto-fantasma', quantity: 1 }] },
  })

  expect(res.status()).toBe(404)
  expect(await res.json()).toMatchObject({ code: 'PRODUCT_NOT_FOUND' })
})
