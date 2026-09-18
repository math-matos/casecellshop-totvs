import type { Order } from '../api/types'
import { formatBRL, formatDateTime } from '../lib/format'
import { CheckIcon } from './Icons'

interface OrderConfirmationProps {
  order: Order
  onNewOrder: () => void
}

/** Tela de sucesso: mostra exatamente o que a API confirmou, não o que o cliente calculou. */
export function OrderConfirmation({ order, onNewOrder }: OrderConfirmationProps) {
  return (
    <section
      className="mx-auto w-[min(560px,100%)] rounded-lg bg-surface p-8 text-center shadow-panel max-[640px]:px-[18px] max-[640px]:py-6"
      aria-label="Pedido confirmado"
      aria-live="polite"
    >
      <span className="mx-auto mb-4 grid size-[52px] place-items-center rounded-full bg-success-soft text-success">
        <CheckIcon className="size-[26px] shrink-0" />
      </span>

      <h2 className="text-[23px] font-bold tracking-[-0.3px]">Pedido confirmado</h2>
      <p className="mt-1.5 text-[14.5px] text-muted">
        Recebemos sua compra em {formatDateTime(order.createdAt)}.
      </p>

      <dl className="my-5 rounded-sm bg-surface-2 p-3">
        <div>
          <dt className="text-[11.5px] font-semibold uppercase tracking-[0.8px] text-muted">
            Número do pedido
          </dt>
          <dd className="mt-1 break-all font-mono text-[13px]">{order.orderId}</dd>
        </div>
      </dl>

      <ul className="border-t border-line text-left">
        {order.items.map((item) => (
          <li
            key={item.productId}
            className="flex items-center gap-2.5 border-b border-line py-[11px] text-sm tabular-nums"
          >
            <span className="min-w-7 font-semibold text-muted">{item.quantity}x</span>
            <span className="flex-1">{item.name}</span>
            <span>{formatBRL(item.subtotalInCents)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-[18px] mb-[22px] flex items-baseline justify-between text-[15px] font-semibold">
        <span>Total pago</span>
        <strong className="text-2xl tracking-[-0.5px]">{formatBRL(order.totalInCents)}</strong>
      </div>

      <button
        type="button"
        className="h-12 w-full rounded-md border-0 bg-brand text-[15px] font-bold text-white shadow-card transition hover:enabled:bg-brand-hover hover:enabled:shadow-panel active:enabled:translate-y-px disabled:opacity-50"
        onClick={onNewOrder}
      >
        Fazer novo pedido
      </button>
    </section>
  )
}
