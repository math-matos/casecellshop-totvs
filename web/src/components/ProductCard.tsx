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
      className="group flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-3.5 shadow-card transition hover:-translate-y-[3px] hover:border-line-strong hover:shadow-panel data-[flagged]:border-danger"
      data-sold-out={soldOut || undefined}
      data-flagged={flagged || undefined}
    >
      <span
        className={`self-start rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
          soldOut ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand'
        }`}
      >
        {soldOut ? 'Esgotado' : `${product.stock} em estoque`}
      </span>

      <ProductImage productId={product.id} category={product.category} name={product.name} />

      <h3 className="text-[15px] font-semibold leading-[1.35]">{product.name}</h3>

      <p className="-mt-1 flex items-baseline gap-2">
        <span className="text-[15px] font-semibold">{formatBRL(product.priceInCents)}</span>
        {discounted && (
          <span className="text-[13px] text-muted line-through">
            {formatBRL(product.compareAtPriceInCents!)}
          </span>
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
        <button
          type="button"
          className="mt-auto flex h-[42px] items-center justify-center gap-1.5 rounded-md border border-line-strong bg-transparent text-sm font-bold text-brand transition hover:enabled:border-brand hover:enabled:bg-brand-soft active:enabled:translate-y-px disabled:border-line disabled:text-muted"
          onClick={onAdd}
          disabled={soldOut}
        >
          <PlusIcon />
          {soldOut ? 'Indisponível' : 'Adicionar'}
        </button>
      )}
    </article>
  )
}
