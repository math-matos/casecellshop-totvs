import { formatBRL } from '../lib/format'
import { TagIcon } from './Icons'

interface OrderTotalsProps {
  subtotalInCents: number
  savingsInCents: number
  totalInCents: number
}

/** Bloco de totais (subtotal, frete, desconto, total) compartilhado entre vitrine e checkout. */
export function OrderTotals({ subtotalInCents, savingsInCents, totalInCents }: OrderTotalsProps) {
  return (
    <>
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
    </>
  )
}
