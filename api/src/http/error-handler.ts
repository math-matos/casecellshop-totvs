import type { FastifyInstance } from 'fastify'
import { AppError, type ErrorResponse } from '../domain/errors.js'
import { MESSAGES } from './validation/checkout-request.js'

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(error.toResponse())
    }

    const { statusCode, message } = describeUnknownError(error)

    if (statusCode === 400) {
      const body: ErrorResponse = { code: 'VALIDATION_ERROR', message: MESSAGES.invalidJson }
      return reply.code(400).send(body)
    }

    if (statusCode >= 400 && statusCode < 500) {
      const body: ErrorResponse = { code: 'VALIDATION_ERROR', message }
      return reply.code(statusCode).send(body)
    }

    request.log.error({ err: error, correlationId: request.id }, 'Erro inesperado')
    const body: ErrorResponse = { code: 'SERVER_ERROR', message: 'Erro de servidor inesperado.' }
    return reply.code(500).send(body)
  })

  app.setNotFoundHandler((request, reply) => {
    return reply.code(404).send({
      code: 'ROUTE_NOT_FOUND',
      message: `Rota ${request.method} ${request.url} não encontrada.`,
    })
  })
}

function describeUnknownError(error: unknown): { statusCode: number; message: string } {
  const candidate = error as { statusCode?: unknown; message?: unknown } | null
  const statusCode = typeof candidate?.statusCode === 'number' ? candidate.statusCode : 500
  const message = typeof candidate?.message === 'string' ? candidate.message : 'Erro desconhecido.'
  return { statusCode, message }
}
