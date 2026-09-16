import { fetchProducts } from './client'
import { ApiError, type Product } from './types'

/**
 * Store do catálogo, fora do React.
 *
 * O componente só assina (`useSyncExternalStore`), então não há busca de dados
 * dentro de efeito nem `setState` em cascata. A carga inicial dispara sozinha
 * quando aparece o primeiro assinante.
 */
export interface ProductsSnapshot {
  products: Product[]
  loading: boolean
  error: ApiError | null
}

const EMPTY: Product[] = []

let snapshot: ProductsSnapshot = { products: EMPTY, loading: true, error: null }
let inFlight: Promise<void> | null = null

const listeners = new Set<() => void>()

function update(patch: Partial<ProductsSnapshot>): void {
  snapshot = { ...snapshot, ...patch }
  for (const listener of listeners) listener()
}

export function getProductsSnapshot(): ProductsSnapshot {
  return snapshot
}

export function subscribeToProducts(listener: () => void): () => void {
  listeners.add(listener)

  // Primeiro assinante: começa a carregar. `loading` já nasce true, então
  // nada é emitido de forma síncrona durante a assinatura.
  if (listeners.size === 1 && snapshot.products === EMPTY && !inFlight) {
    void reloadProducts({ silent: true })
  }

  return () => {
    listeners.delete(listener)
  }
}

/**
 * Recarrega o catálogo. Chamadas concorrentes compartilham a mesma requisição.
 * Use `silent` para atualizar o estoque sem piscar o esqueleto de carregamento.
 */
export function reloadProducts(options: { silent?: boolean } = {}): Promise<void> {
  if (inFlight) return inFlight

  if (!options.silent) update({ loading: true, error: null })

  inFlight = (async () => {
    try {
      update({ products: await fetchProducts(), error: null })
    } catch (error) {
      update({
        error:
          error instanceof ApiError
            ? error
            : new ApiError(0, 'SERVER_ERROR', 'Falha ao carregar o catálogo.'),
      })
    } finally {
      inFlight = null
      update({ loading: false })
    }
  })()

  return inFlight
}
