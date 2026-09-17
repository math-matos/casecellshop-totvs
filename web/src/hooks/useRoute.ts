import { useLocation, useNavigate } from 'react-router'

export interface Route {
  path: string
  navigate: (path: string) => void
}

/**
 * Adaptador fino sobre o react-router: expõe o par `path`/`navigate` que o app
 * usa, mantendo o mesmo contrato de antes. O `<BrowserRouter>` fica em `main.tsx`.
 */
export function useRoute(): Route {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return { path: pathname, navigate: (path) => navigate(path) }
}
