import type { Product } from '../api/types'
import { formatBRL, hasDiscount } from '../lib/format'
import { PlusIcon } from './Icons'
import { ProductImage } from './ProductImage'
import { QuantityStepper } from './QuantityStepper'

interface ProductCardProps {
  product: Product
  quantity: number
  /** Marca o card quando a API recusou a compra por falta de estoque deste item. */
  flagged?: boolean
  onAdd: () => void
  onIncrease: () => void
  onDecrease: () => void
}

export function ProductCard({
  product,
  quantity,
  flagged = false,
  onAdd,
  onIncrease,
  onDecrease,
}: ProductCardProps) {
  const soldOut = product.stock === 0
  const discounted = hasDiscount(product)

  return (
    <article
      className="card"
      data-sold-out={soldOut || undefined}
      data-flagged={flagged || undefined}
    >
      <span className={`card__stock ${soldOut ? 'card__stock--out' : ''}`}>
        {soldOut ? 'Esgotado' : `${product.stock} em estoque`}
      </span>

      <ProductImage productId={product.id} category={product.category} name={product.name} />

      <h3 className="card__name">{product.name}</h3>

      <p className="card__price">
        <span className="card__price-now">{formatBRL(product.priceInCents)}</span>
        {discounted && (
          <span className="card__price-was">{formatBRL(product.compareAtPriceInCents!)}</span>
        )}
      </p>

      {quantity > 0 ? (
        <QuantityStepper
          quantity={quantity}
          max={product.stock}
          productName={product.name}
          onDecrease={onDecrease}
          onIncrease={onIncrease}
        />
      ) : (
        <button type="button" className="card__add" onClick={onAdd} disabled={soldOut}>
          <PlusIcon />
          {soldOut ? 'Indisponível' : 'Adicionar'}
        </button>
      )}
    </article>
  )
}
