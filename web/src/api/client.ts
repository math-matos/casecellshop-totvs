import { ApiError, type ApiErrorCode, type Order, type Product } from './types'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

interface ErrorBody {
  code?: string
  message?: string
  details?: Record<string, unknown>
}

/** Converte uma resposta de erro da API em ApiError, com fallback quando o corpo não é JSON. */
async function toApiError(response: Response): Promise<ApiError> {
  let body: ErrorBody = {}

  try {
    body = (await response.json()) as ErrorBody
  } catch {
    // Resposta sem corpo JSON (proxy, gateway). Mantém o fallback abaixo.
  }

  const code = (body.code ?? 'SERVER_ERROR') as ApiErrorCode
  const message = body.message ?? 'Não foi possível concluir a operação. Tente novamente.'

  return new ApiError(response.status, code, message, body.details)
}

/** Erros de rede (API fora do ar, CORS, DNS) viram um ApiError com code NETWORK_ERROR. */
function toNetworkError(): ApiError {
  return new ApiError(
    0,
    'NETWORK_ERROR',
    'Não foi possível falar com a API. Verifique se ela está rodando.',
  )
}

export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  let response: Response

  try {
    response = await fetch(`${BASE_URL}/products`, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw toNetworkError()
  }

  if (!response.ok) throw await toApiError(response)

  const body = (await response.json()) as { products: Product[] }
  return body.products
}

export interface CheckoutItemInput {
  productId: string
  quantity: number
}

/**
 * POST /checkout.
 *
 * A Idempotency-Key é gerada por tentativa de compra e reaproveitada nos retries,
 * para que um clique duplo ou uma reconexão não criem dois pedidos.
 * O preço não é enviado: quem calcula o total é o backend.
 */
export async function createCheckout(
  items: CheckoutItemInput[],
  idempotencyKey: string,
): Promise<Order> {
  let response: Response

  try {
    response = await fetch(`${BASE_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'X-Correlation-Id': crypto.randomUUID(),
      },
      body: JSON.stringify({ items }),
    })
  } catch {
    throw toNetworkError()
  }

  if (!response.ok) throw await toApiError(response)

  return (await response.json()) as Order
}
