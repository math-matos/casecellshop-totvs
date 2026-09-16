import type { ApiError, Product } from '../api/types'
import { formatBRL } from '../lib/format'
import { AlertIcon, CartIcon, TagIcon, TrashIcon } from './Icons'
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
  submitting: boolean
  error: ApiError | null
  onIncrease: (productId: string) => void
  onDecrease: (productId: string) => void
  onRemove: (productId: string) => void
  onClear: () => void
  onSubmit: () => void
}

export function OrderSummary({
  lines,
  totalInCents,
  savingsInCents,
  submitting,
  error,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onSubmit,
}: OrderSummaryProps) {
  const empty = lines.length === 0
  const subtotalInCents = totalInCents + savingsInCents

  return (
    <aside className="order" aria-label="Detalhes do pedido">
      <header className="order__head">
        <h2>Detalhes do pedido</h2>
        {!empty && (
          <button type="button" className="icon-btn" onClick={onClear} aria-label="Limpar pedido">
            <TrashIcon />
          </button>
        )}
      </header>

      {empty ? (
        <div className="order__empty">
          <CartIcon />
          <p className="order__empty-title">Seu pedido está vazio</p>
          <p className="order__empty-text">Escolha produtos ao lado para montar a compra.</p>
        </div>
      ) : (
        <ul className="order__list">
          {lines.map(({ product, quantity }) => {
            const hasDiscount =
              product.compareAtPriceInCents !== undefined &&
              product.compareAtPriceInCents > product.priceInCents

            return (
              <li key={product.id} className="order__item">
                <ProductImage
                  productId={product.id}
                  category={product.category}
                  name={product.name}
                  variant="thumb"
                />

                <div className="order__item-info">
                  <p className="order__item-name">{product.name}</p>
                  <p className="order__item-price">
                    <span>{formatBRL(product.priceInCents)}</span>
                    {hasDiscount && (
                      <s className="order__item-was">
                        {formatBRL(product.compareAtPriceInCents!)}
                      </s>
                    )}
                  </p>
                </div>

                <div className="order__item-actions">
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
                    className="icon-btn"
                    onClick={() => onRemove(product.id)}
                    aria-label={`Remover ${product.name}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="order__foot">
        {savingsInCents > 0 && (
          <p className="order__promo">
            <TagIcon />
            <span>Promoção aplicada</span>
            <strong>-{formatBRL(savingsInCents)}</strong>
          </p>
        )}

        <dl className="order__totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatBRL(subtotalInCents)}</dd>
          </div>
          <div>
            <dt>Frete</dt>
            <dd className="order__free">Grátis</dd>
          </div>
          <div>
            <dt>Desconto</dt>
            <dd>{savingsInCents > 0 ? `-${formatBRL(savingsInCents)}` : formatBRL(0)}</dd>
          </div>
        </dl>

        <div className="order__total">
          <span>Total</span>
          <strong>{formatBRL(totalInCents)}</strong>
        </div>

        {error && (
          <p className="alert alert--error" role="alert">
            <AlertIcon />
            <span>{error.message}</span>
          </p>
        )}

        <button
          type="button"
          className="btn-primary"
          onClick={onSubmit}
          disabled={empty || submitting}
        >
          {submitting ? 'Processando...' : 'Continuar'}
        </button>

        <p className="order__note">O valor final é calculado e confirmado pela API.</p>
      </div>
    </aside>
  )
}
