import type { ApiError } from '../api/types'
import { formatBRL, hasDiscount } from '../lib/format'
import { AlertIcon, TrashIcon } from './Icons'
import type { OrderLine } from './OrderSummary'
import { OrderTotals } from './OrderTotals'
import { ProductImage } from './ProductImage'
import { QuantityStepper } from './QuantityStepper'

interface CheckoutPageProps {
  lines: OrderLine[]
  totalInCents: number
  savingsInCents: number
  submitting: boolean
  error: ApiError | null
  onIncrease: (productId: string) => void
  onDecrease: (productId: string) => void
  onRemove: (productId: string) => void
  onBack: () => void
  onFinalize: () => void
}

const PAYMENT_BADGES = ['Visa', 'Mastercard', 'Elo', 'Pix']

/**
 * Tela de checkout (rota /checkout): revisão do carrinho + resumo do pedido.
 *
 * "Finalizar compra" chama a API de verdade (POST /checkout). Não há coleta de
 * pagamento aqui: o escopo do case é a API de checkout, não um gateway de
 * pagamento, e os métodos abaixo são só um selo informativo.
 */
export function CheckoutPage({
  lines,
  totalInCents,
  savingsInCents,
  submitting,
  error,
  onIncrease,
  onDecrease,
  onRemove,
  onBack,
  onFinalize,
}: CheckoutPageProps) {
  const subtotalInCents = totalInCents + savingsInCents
  const itemCount = lines.reduce((sum, { quantity }) => sum + quantity, 0)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_344px] items-start gap-5 max-[960px]:grid-cols-[minmax(0,1fr)]">
      <section aria-label="Seu carrinho">
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold tracking-[-0.2px]">
            Seu carrinho
            <span className="ml-1.5 text-sm font-medium text-muted">
              ({itemCount} {itemCount === 1 ? 'produto' : 'produtos'})
            </span>
          </h2>
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-[13.5px] font-semibold text-brand hover:underline"
            onClick={onBack}
          >
            Continuar comprando
          </button>
        </div>

        <p className="mb-[18px] text-[13px] text-muted">
          Os itens do carrinho não ficam reservados. Finalize a compra para garantir o pedido.
        </p>

        <ul className="flex flex-col gap-3.5">
          {lines.map(({ product, quantity }) => {
            const discounted = hasDiscount(product)

            return (
              <li
                key={product.id}
                className="grid grid-cols-[92px_minmax(0,1fr)_auto] items-start gap-3.5 rounded-lg bg-surface p-4 shadow-card max-[640px]:grid-cols-[72px_minmax(0,1fr)] max-[640px]:grid-rows-[auto_auto]"
              >
                <ProductImage
                  productId={product.id}
                  category={product.category}
                  name={product.name}
                  variant="card"
                />

                <div>
                  <p className="text-[15px] font-semibold leading-[1.35]">{product.name}</p>
                  <p className="mt-1 flex items-baseline gap-2 text-sm">
                    <span>{formatBRL(product.priceInCents)}</span>
                    {discounted && (
                      <s className="text-[12.5px] text-muted line-through">
                        {formatBRL(product.compareAtPriceInCents!)}
                      </s>
                    )}
                  </p>

                  <div className="mt-3 flex items-center gap-[18px] max-[640px]:flex-wrap max-[640px]:gap-3">
                    <QuantityStepper
                      quantity={quantity}
                      max={product.stock}
                      productName={product.name}
                      tone="ghost"
                      onDecrease={() => onDecrease(product.id)}
                      onIncrease={() => onIncrease(product.id)}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center gap-[5px] border-0 bg-transparent p-0 text-[13.5px] font-medium text-muted hover:text-danger"
                      onClick={() => onRemove(product.id)}
                    >
                      <TrashIcon className="size-[14px] shrink-0" />
                      Remover
                    </button>
                  </div>
                </div>

                <span className="whitespace-nowrap text-[15px] font-bold tabular-nums max-[640px]:col-start-2 max-[640px]:mt-1.5 max-[640px]:justify-self-end">
                  {formatBRL(product.priceInCents * quantity)}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <aside
        className="sticky top-5 flex max-h-[calc(100svh-40px)] flex-col rounded-lg bg-surface p-5 shadow-panel max-[960px]:static max-[960px]:max-h-none"
        aria-label="Resumo do pedido"
      >
        <header className="flex items-center justify-between gap-3 pb-3.5">
          <h2 className="text-[19px] font-bold tracking-[-0.2px]">Resumo do pedido</h2>
        </header>

        <div>
          <OrderTotals
            subtotalInCents={subtotalInCents}
            savingsInCents={savingsInCents}
            totalInCents={totalInCents}
          />

          {error && (
            <p
              className="mb-3 flex items-start gap-[9px] rounded-sm bg-danger-soft px-3 py-2.5 text-[13px] font-medium leading-[1.4] text-danger"
              role="alert"
            >
              <AlertIcon className="mt-px size-4 shrink-0" />
              <span>{error.message}</span>
            </p>
          )}

          <button
            type="button"
            className="h-12 w-full rounded-md border-0 bg-brand text-[15px] font-bold text-white shadow-card transition hover:enabled:bg-brand-hover hover:enabled:shadow-panel active:enabled:translate-y-px disabled:opacity-50"
            onClick={onFinalize}
            disabled={submitting}
          >
            {submitting ? 'Processando...' : 'Finalizar compra'}
          </button>

          <div className="mt-3.5 border-t border-line pt-3.5 text-center">
            <span className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.6px] text-muted">
              Métodos de pagamento aceitos
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {PAYMENT_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-[6px] border border-line-strong px-2.5 py-1 text-[11px] font-semibold text-muted"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
