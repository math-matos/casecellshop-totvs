import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void): () => void {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

function getSnapshot(): string {
  return window.location.pathname
}

export interface Route {
  path: string
  navigate: (path: string) => void
}

/**
 * Roteamento mínimo baseado na History API, sem depender de uma lib de rotas.
 *
 * Cobre só o que o app precisa: alternar entre a vitrine ("/") e o checkout
 * ("/checkout") com uma URL real na barra de endereço, e reagir ao botão
 * voltar/avançar do navegador. Segue o mesmo padrão subscribe/snapshot do
 * `products-store.ts`, lido via `useSyncExternalStore`.
 */
export function useRoute(): Route {
  const path = useSyncExternalStore(subscribe, getSnapshot)

  const navigate = (next: string) => {
    if (next === window.location.pathname) return
    window.history.pushState({}, '', next)
    // pushState não dispara popstate sozinho, então avisamos os assinantes na mão.
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return { path, navigate }
}
