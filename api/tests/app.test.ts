import { test, expect } from 'vitest'
import { buildApp } from '../src/app.js'

test('GET / retorna status ok', async () => {
  const app = buildApp()
  const res = await app.inject({ method: 'GET', url: '/' })

  expect(res.statusCode).toBe(200)
  expect(res.json()).toEqual({ status: 'ok' })
})
