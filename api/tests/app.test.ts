import { describe, expect, test } from 'vitest'
import { makeApp } from './helpers.js'

describe('app', () => {
  test('GET / retorna status ok', async () => {
    const app = makeApp()
    const res = await app.inject({ method: 'GET', url: '/' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  test('ecoa o X-Correlation-Id enviado pelo cliente', async () => {
    const app = makeApp()
    const res = await app.inject({
      method: 'GET',
      url: '/',
      headers: { 'x-correlation-id': 'corr-123' },
    })

    expect(res.headers['x-correlation-id']).toBe('corr-123')
  })

  test('gera um X-Correlation-Id quando o cliente não envia', async () => {
    const app = makeApp()
    const res = await app.inject({ method: 'GET', url: '/' })

    expect(res.headers['x-correlation-id']).toMatch(/^[0-9a-f-]{36}$/)
  })

  test('rota inexistente retorna 404 no formato padrão de erro', async () => {
    const app = makeApp()
    const res = await app.inject({ method: 'GET', url: '/nao-existe' })

    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ code: 'ROUTE_NOT_FOUND' })
  })
})
