import type { FastifyPluginAsync } from 'fastify'
import type { CheckoutService } from '../../domain/checkout-service.js'
import type { Order } from '../../domain/order.js'
import { parseCheckoutBody, parseIdempotencyKey } from '../validation/checkout-request.js'

export interface CheckoutResponse {
  orderId: string
  status: Order['status']
  items: Order['items']
  totalInCents: number
  createdAt: string
}

export function toCheckoutResponse(order: Order): CheckoutResponse {
  return {
    orderId: order.id,
    status: order.status,
    items: order.items,
    totalInCents: order.totalInCents,
    createdAt: order.createdAt,
  }
}

export function checkoutRoutes(checkoutService: CheckoutService): FastifyPluginAsync {
  return async (app) => {
    app.post('/checkout', async (request, reply) => {
      const idempotencyKey = parseIdempotencyKey(request.headers['idempotency-key'])
      const items = parseCheckoutBody(request.body)

      const { order, replayed } = await checkoutService.checkout({ idempotencyKey, items })

      return reply
        .code(201)
        .header('Idempotent-Replayed', String(replayed))
        .send(toCheckoutResponse(order))
    })
  }
}
