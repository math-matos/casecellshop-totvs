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
    <main className="mx-auto w-[min(1180px,100%)] px-6 pt-7 pb-14 max-[640px]:px-4 max-[640px]:pt-5 max-[640px]:pb-10">
      <div className="mb-[22px] flex items-end justify-between gap-6 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-[14px]">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.4px] max-[640px]:text-[22px]">
            {heading.title}
          </h1>
          <p className="mt-1 text-[14.5px] text-muted">{heading.subtitle}</p>
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
        <div className="mx-auto mt-10 w-[min(420px,100%)] rounded-lg bg-surface p-8 text-center shadow-panel">
          <p className="mb-[18px] text-muted">Seu carrinho está vazio.</p>
          <button
            type="button"
            className="h-12 w-full rounded-md border-0 bg-brand text-[15px] font-bold text-white shadow-card transition hover:enabled:bg-brand-hover hover:enabled:shadow-panel active:enabled:translate-y-px disabled:opacity-50"
            onClick={() => navigate('/')}
          >
            Ver produtos
          </button>
        </div>
      )}

      {view === 'shopping' && (
        <div className="grid grid-cols-[minmax(0,1fr)_344px] items-start gap-5 max-[960px]:grid-cols-[minmax(0,1fr)]">
          <section aria-label="Catálogo de produtos">
            <div
              className="mb-4 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filtrar por categoria"
            >
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  className="whitespace-nowrap rounded-full border border-line bg-surface px-4 py-[9px] text-sm font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink data-[active]:border-brand data-[active]:bg-brand-soft data-[active]:font-bold data-[active]:text-brand-hover"
                  data-active={filter === item.id || undefined}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {loading && (
              <div
                className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-4 max-[640px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] max-[640px]:gap-3"
                aria-hidden
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-3.5 shadow-card"
                  >
                    <div className="h-5 w-[90px] self-start rounded-full bg-surface-2 motion-safe:animate-pulse" />
                    <div className="aspect-square rounded-md bg-surface-2 motion-safe:animate-pulse" />
                    <div className="h-3 w-[70%] rounded-sm bg-surface-2 motion-safe:animate-pulse" />
                    <div className="h-3 w-[45%] rounded-sm bg-surface-2 motion-safe:animate-pulse" />
                    <div className="mt-auto h-[38px] rounded-md bg-surface-2 motion-safe:animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {!loading && loadError && (
              <div
                className="flex items-start gap-[9px] rounded-sm border border-line bg-surface p-5 text-[13px] text-muted"
                role="alert"
              >
                <AlertIcon className="size-5 shrink-0 text-danger" />
                <div>
                  <p className="text-[14.5px] font-semibold text-ink">{loadError.message}</p>
                  <button
                    type="button"
                    className="mt-2 rounded-[10px] border border-line-strong bg-surface px-3.5 py-[7px] text-[13.5px] font-semibold hover:border-brand hover:text-brand"
                    onClick={() => void reloadProducts()}
                  >
                    Tentar de novo
                  </button>
                </div>
              </div>
            )}

            {!loading && !loadError && visibleProducts.length === 0 && (
              <p className="py-10 text-center text-[14.5px] text-muted">
                Nenhum produto nesta categoria.
              </p>
            )}

            {!loading && !loadError && visibleProducts.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-4 max-[640px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] max-[640px]:gap-3">
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
