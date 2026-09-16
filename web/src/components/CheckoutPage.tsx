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
    <div className="shell">
      <section className="checkout__cart" aria-label="Seu carrinho">
        <div className="checkout__cart-head">
          <h2>
            Seu carrinho
            <span className="checkout__count">
              ({itemCount} {itemCount === 1 ? 'produto' : 'produtos'})
            </span>
          </h2>
          <button type="button" className="btn-link" onClick={onBack}>
            Continuar comprando
          </button>
        </div>

        <p className="checkout__hint">
          Os itens do carrinho não ficam reservados. Finalize a compra para garantir o pedido.
        </p>

        <ul className="checkout__list">
          {lines.map(({ product, quantity }) => {
            const discounted = hasDiscount(product)

            return (
              <li key={product.id} className="checkout__item">
                <ProductImage
                  productId={product.id}
                  category={product.category}
                  name={product.name}
                  variant="card"
                />

                <div className="checkout__item-info">
                  <p className="checkout__item-name">{product.name}</p>
                  <p className="checkout__item-price">
                    <span>{formatBRL(product.priceInCents)}</span>
                    {discounted && (
                      <s className="checkout__item-was">
                        {formatBRL(product.compareAtPriceInCents!)}
                      </s>
                    )}
                  </p>

                  <div className="checkout__item-actions">
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
                      className="btn-link btn-link--muted"
                      onClick={() => onRemove(product.id)}
                    >
                      <TrashIcon />
                      Remover
                    </button>
                  </div>
                </div>

                <span className="checkout__item-subtotal">
                  {formatBRL(product.priceInCents * quantity)}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <aside className="order" aria-label="Resumo do pedido">
        <header className="order__head">
          <h2>Resumo do pedido</h2>
        </header>

        <div className="order__foot order__foot--flush">
          <OrderTotals
            subtotalInCents={subtotalInCents}
            savingsInCents={savingsInCents}
            totalInCents={totalInCents}
          />

          {error && (
            <p className="alert alert--error" role="alert">
              <AlertIcon />
              <span>{error.message}</span>
            </p>
          )}

          <button type="button" className="btn-primary" onClick={onFinalize} disabled={submitting}>
            {submitting ? 'Processando...' : 'Finalizar compra'}
          </button>

          <div className="checkout__payments">
            <span>Métodos de pagamento aceitos</span>
            <div className="checkout__payment-badges">
              {PAYMENT_BADGES.map((badge) => (
                <span key={badge} className="checkout__payment-badge">
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
