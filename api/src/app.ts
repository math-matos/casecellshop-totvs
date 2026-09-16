import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { CheckoutService } from './domain/checkout-service.js'
import { registerErrorHandler } from './http/error-handler.js'
import { checkoutRoutes } from './http/routes/checkout.js'
import { productRoutes } from './http/routes/products.js'
import {
  InMemoryIdempotencyStore,
  type IdempotencyStore,
} from './repositories/idempotency-store.js'
import { InMemoryOrderRepository, type OrderRepository } from './repositories/order-repository.js'
import {
  InMemoryProductRepository,
  type ProductRepository,
} from './repositories/product-repository.js'

export interface AppOptions {
  logger?: boolean
  productRepository?: ProductRepository
  orderRepository?: OrderRepository
  idempotencyStore?: IdempotencyStore
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const productRepository = options.productRepository ?? new InMemoryProductRepository()
  const orderRepository = options.orderRepository ?? new InMemoryOrderRepository()
  const idempotencyStore = options.idempotencyStore ?? new InMemoryIdempotencyStore()

  const checkoutService = new CheckoutService({
    productRepository,
    orderRepository,
    idempotencyStore,
  })

  const app = Fastify({
    logger: options.logger ?? false,
    requestIdHeader: 'x-correlation-id',
    genReqId: () => randomUUID(),
  })

  app.register(cors)

  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Correlation-Id', request.id)
  })

  registerErrorHandler(app)

  app.get('/', async () => {
    return { status: 'ok' }
  })

  app.register(productRoutes(productRepository))
  app.register(checkoutRoutes(checkoutService))

  return app
}
