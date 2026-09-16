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
    <section className="confirmation" aria-live="polite">
      <span className="confirmation__badge">
        <CheckIcon />
      </span>

      <h2>Pedido confirmado</h2>
      <p className="confirmation__text">
        Recebemos sua compra em {formatDateTime(order.createdAt)}.
      </p>

      <dl className="confirmation__meta">
        <div>
          <dt>Número do pedido</dt>
          <dd className="confirmation__id">{order.orderId}</dd>
        </div>
      </dl>

      <ul className="confirmation__items">
        {order.items.map((item) => (
          <li key={item.productId}>
            <span className="confirmation__qty">{item.quantity}x</span>
            <span className="confirmation__item-name">{item.name}</span>
            <span>{formatBRL(item.subtotalInCents)}</span>
          </li>
        ))}
      </ul>

      <div className="confirmation__total">
        <span>Total pago</span>
        <strong>{formatBRL(order.totalInCents)}</strong>
      </div>

      <button type="button" className="btn-primary" onClick={onNewOrder}>
        Fazer novo pedido
      </button>
    </section>
  )
}
