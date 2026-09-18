import type { ApiError, Product } from '../api/types'
import { formatBRL, hasDiscount } from '../lib/format'
import { AlertIcon, CartIcon, TrashIcon } from './Icons'
import { OrderTotals } from './OrderTotals'
import { ProductImage } from './ProductImage'
import { QuantityStepper } from './QuantityStepper'

export interface OrderLine {
  product: Product
  quantity: number
}

interface OrderSummaryProps {
  lines: OrderLine[]
  /** Soma de preço x quantidade. É o mesmo total que a API devolve no pedido. */
  totalInCents: number
  /** Quanto o cliente economiza em relação ao preço "de". */
  savingsInCents: number
  /** Erro de uma tentativa de checkout anterior para este mesmo carrinho, se houver. */
  error: ApiError | null
  onIncrease: (productId: string) => void
  onDecrease: (productId: string) => void
  onRemove: (productId: string) => void
  onClear: () => void
  /** Leva para a tela /checkout. A compra só é enviada de lá. */
  onContinue: () => void
}

export function OrderSummary({
  lines,
  totalInCents,
  savingsInCents,
  error,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onContinue,
}: OrderSummaryProps) {
  const empty = lines.length === 0
  const subtotalInCents = totalInCents + savingsInCents

  return (
    <aside
      className="sticky top-5 flex max-h-[calc(100svh-40px)] flex-col rounded-lg bg-surface p-5 shadow-panel max-[960px]:static max-[960px]:max-h-none"
      aria-label="Detalhes do pedido"
    >
      <header className="flex items-center justify-between gap-3 pb-3.5">
        <h2 className="text-[19px] font-bold tracking-[-0.2px]">Detalhes do pedido</h2>
        {!empty && (
          <button
            type="button"
            className="grid size-8 place-items-center rounded-[9px] border-0 bg-transparent text-muted transition-colors hover:bg-danger-soft hover:text-danger"
            onClick={onClear}
            aria-label="Limpar pedido"
          >
            <TrashIcon />
          </button>
        )}
      </header>

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-3 py-9 text-center text-muted">
          <CartIcon className="mb-1 size-7 shrink-0" />
          <p className="text-[14.5px] font-semibold text-ink">Seu pedido está vazio</p>
          <p className="max-w-[24ch] text-[13px]">Escolha produtos ao lado para montar a compra.</p>
        </div>
      ) : (
        <ul className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 max-[960px]:overflow-visible">
          {lines.map(({ product, quantity }) => {
            const discounted = hasDiscount(product)

            return (
              <li
                key={product.id}
                className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-line py-2.5 last:border-b-0"
              >
                <ProductImage
                  productId={product.id}
                  category={product.category}
                  name={product.name}
                  variant="thumb"
                />

                <div>
                  <p className="text-sm font-semibold leading-[1.3]">{product.name}</p>
                  <p className="mt-0.5 flex items-baseline gap-1.5 text-[13px]">
                    <span>{formatBRL(product.priceInCents)}</span>
                    {discounted && (
                      <s className="text-xs text-muted">
                        {formatBRL(product.compareAtPriceInCents!)}
                      </s>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-0.5">
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
                    className="grid size-7 place-items-center rounded-[9px] border-0 bg-transparent text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    onClick={() => onRemove(product.id)}
                    aria-label={`Remover ${product.name}`}
                  >
                    <TrashIcon className="size-[15px] shrink-0" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-1 border-t border-dashed border-line-strong pt-3.5">
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
          onClick={onContinue}
          disabled={empty}
        >
          Continuar
        </button>

        <p className="mt-2.5 text-center text-[11.5px] text-muted">
          O valor final é calculado e confirmado pela API.
        </p>
      </div>
    </aside>
  )
}
