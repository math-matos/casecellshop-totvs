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
        <p className="mb-3 flex items-center gap-2 rounded-sm bg-success-soft px-3 py-[9px] text-[13px] font-semibold text-success">
          <TagIcon className="size-4 shrink-0" />
          <span className="flex-1">Promoção aplicada</span>
          <strong>-{formatBRL(savingsInCents)}</strong>
        </p>
      )}

      <dl className="flex flex-col gap-[7px] text-[13.5px]">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Subtotal</dt>
          <dd className="tabular-nums">{formatBRL(subtotalInCents)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Frete</dt>
          <dd className="font-semibold text-success">Grátis</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Desconto</dt>
          <dd className="tabular-nums">
            {savingsInCents > 0 ? `-${formatBRL(savingsInCents)}` : formatBRL(0)}
          </dd>
        </div>
      </dl>

      <div className="mt-3.5 mb-3 flex items-baseline justify-between gap-3 border-t border-line pt-3 text-[15px] font-semibold">
        <span>Total</span>
        <strong className="text-[23px] tracking-[-0.5px] tabular-nums">
          {formatBRL(totalInCents)}
        </strong>
      </div>
    </>
  )
}
