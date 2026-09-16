import { describe, expect, test } from 'vitest'
import { buildApp } from '../src/app.js'
import { catalogSeed } from '../src/domain/product.js'
import { makeApp, PRODUCTS } from './helpers.js'

describe('GET /products', () => {
  test('lista os produtos com preço e estoque', async () => {
    const app = makeApp()
    const res = await app.inject({ method: 'GET', url: '/products' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ products: PRODUCTS })
  })

  test('a app padrão sobe com o catálogo seed', async () => {
    const app = buildApp()
    const res = await app.inject({ method: 'GET', url: '/products' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ products: catalogSeed })
  })
})
