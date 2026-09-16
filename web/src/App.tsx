import { useRef, useState, useSyncExternalStore } from 'react'
import { createCheckout } from './api/client'
import {
  getProductsSnapshot,
  reloadProducts,
  subscribeToProducts,
} from './api/products-store'
import { ApiError, type Category, type Order } from './api/types'
import { AlertIcon } from './components/Icons'
import { CheckoutPage } from './components/CheckoutPage'
import { OrderConfirmation } from './components/OrderConfirmation'
import { OrderSummary } from './components/OrderSummary'
import { ProductCard } from './components/ProductCard'
import { TotvsOffering } from './components/TotvsOffering'
import { useCart } from './hooks/useCart'
import { useRoute } from './hooks/useRoute'
import './App.css'

type Filter = 'todos' | Category

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos os produtos' },
  { id: 'capinhas', label: 'Capinhas' },
  { id: 'peliculas', label: 'Películas' },
  { id: 'carregadores', label: 'Carregadores' },
  { id: 'audio', label: 'Áudio' },
]

/** Erro de checkout guardado junto do carrinho que o causou, para sumir quando o carrinho muda. */
interface CheckoutFailure {
  signature: string
  error: ApiError
}

export default function App() {
  const { products, loading, error: loadError } = useSyncExternalStore(
    subscribeToProducts,
    getProductsSnapshot,
  )

  const { path, navigate } = useRoute()
  const [filter, setFilter] = useState<Filter>('todos')

  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<CheckoutFailure | null>(null)
  const [order, setOrder] = useState<Order | null>(null)

  const cart = useCart(products)

  /** Identidade do carrinho atual. Muda sempre que itens ou quantidades mudam. */
  const cartSignature = cart.items
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join('|')

  /**
   * A Idempotency-Key vale para uma tentativa de compra.
   * Enquanto o carrinho não muda, a mesma chave é reaproveitada, então um clique duplo
   * ou um retry depois de falha de rede nunca criam dois pedidos.
   */
  const idempotency = useRef<{ signature: string; key: string } | null>(null)

  const handleFinalize = async () => {
    if (cart.items.length === 0 || submitting) return

    const reusable = idempotency.current
    const key = reusable?.signature === cartSignature ? reusable.key : crypto.randomUUID()
    idempotency.current = { signature: cartSignature, key }

    setSubmitting(true)
    setFailure(null)

    try {
      const confirmed = await createCheckout(cart.items, key)
      setOrder(confirmed)
      cart.clear()
      idempotency.current = null
      navigate('/payment-confirmed')
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError(0, 'SERVER_ERROR', 'Erro inesperado ao finalizar a compra.')

      // Conflitos de Idempotency-Key são detalhe interno: o cliente só precisa saber que deve tentar de novo.
      const isIdempotencyConflict =
        apiError.code === 'IDEMPOTENCY_KEY_REUSED' || apiError.code === 'IDEMPOTENCY_REQUEST_IN_PROGRESS'
      const displayError = isIdempotencyConflict
        ? new ApiError(apiError.status, apiError.code, 'Não foi possível confirmar o pedido. Tente gerar um novo pedido.')
        : apiError

      setFailure({ signature: cartSignature, error: displayError })

      // O estoque pode ter mudado por causa de outra compra: sincroniza a vitrine.
      if (apiError.code === 'INSUFFICIENT_STOCK') void reloadProducts({ silent: true })
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewOrder = () => {
    setOrder(null)
    idempotency.current = null
    navigate('/')
    void reloadProducts({ silent: true })
  }

  const visibleProducts =
    filter === 'todos' ? products : products.filter((item) => item.category === filter)

  // O erro só continua valendo enquanto o carrinho for o mesmo que falhou.
  const checkoutError = failure?.signature === cartSignature ? failure.error : null

  const wantsCheckout = path === '/checkout'
  const view = order
    ? 'confirmation'
    : wantsCheckout
      ? cart.items.length > 0
        ? 'checkout'
        : 'checkout-empty'
      : 'shopping'

  const heading =
    view === 'confirmation'
      ? { title: 'Pedido confirmado', subtitle: 'Guarde o número do pedido para acompanhamento.' }
      : view === 'checkout' || view === 'checkout-empty'
        ? { title: 'Finalize sua compra', subtitle: 'Revise os itens e conclua o pedido.' }
        : {
            title: 'Monte seu pedido',
            subtitle: 'Acessórios para celular com entrega grátis e estoque em tempo real.',
          }

  return (
    <main className="page">
      <div className="page__top">
        <div className="page__intro">
          <h1>{heading.title}</h1>
          <p>{heading.subtitle}</p>
        </div>
        <TotvsOffering />
      </div>

      {view === 'confirmation' && order && (
        <OrderConfirmation order={order} onNewOrder={handleNewOrder} />
      )}

      {view === 'checkout' && (
        <CheckoutPage
          lines={cart.lines}
          totalInCents={cart.totalInCents}
          savingsInCents={cart.savingsInCents}
          submitting={submitting}
          error={checkoutError}
          onIncrease={(productId) => {
            const product = products.find((item) => item.id === productId)
            if (product) cart.increase(productId, product.stock)
          }}
          onDecrease={cart.decrease}
          onRemove={cart.remove}
          onBack={() => navigate('/')}
          onFinalize={() => void handleFinalize()}
        />
      )}

      {view === 'checkout-empty' && (
        <div className="checkout-empty">
          <p>Seu carrinho está vazio.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/')}>
            Ver produtos
          </button>
        </div>
      )}

      {view === 'shopping' && (
        <div className="shell">
          <section className="catalog" aria-label="Catálogo de produtos">
            <div className="chips" role="tablist" aria-label="Filtrar por categoria">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  className="chip"
                  data-active={filter === item.id || undefined}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {loading && (
              <div className="grid" aria-hidden>
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="card card--skeleton">
                    <div className="skeleton-line skeleton-line--badge" />
                    <div className="skeleton-block" />
                    <div className="skeleton-line skeleton-line--title" />
                    <div className="skeleton-line skeleton-line--price" />
                    <div className="skeleton-line skeleton-line--button" />
                  </div>
                ))}
              </div>
            )}

            {!loading && loadError && (
              <div className="alert alert--block" role="alert">
                <AlertIcon />
                <div>
                  <p className="alert__title">{loadError.message}</p>
                  <button type="button" className="btn-ghost" onClick={() => void reloadProducts()}>
                    Tentar de novo
                  </button>
                </div>
              </div>
            )}

            {!loading && !loadError && visibleProducts.length === 0 && (
              <p className="catalog__empty">Nenhum produto nesta categoria.</p>
            )}

            {!loading && !loadError && visibleProducts.length > 0 && (
              <div className="grid">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={cart.quantityOf(product.id)}
                    flagged={checkoutError?.productId === product.id}
                    onAdd={() => cart.add(product)}
                    onIncrease={() => cart.increase(product.id, product.stock)}
                    onDecrease={() => cart.decrease(product.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <OrderSummary
            lines={cart.lines}
            totalInCents={cart.totalInCents}
            savingsInCents={cart.savingsInCents}
            error={checkoutError}
            onIncrease={(productId) => {
              const product = products.find((item) => item.id === productId)
              if (product) cart.increase(productId, product.stock)
            }}
            onDecrease={cart.decrease}
            onRemove={cart.remove}
            onClear={cart.clear}
            onContinue={() => navigate('/checkout')}
          />
        </div>
      )}
    </main>
  )
}
