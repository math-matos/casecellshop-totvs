import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: false,
  })

  app.register(cors)

  app.get('/', async () => {
    return { status: 'ok' }
  })

  return app
}
