import { MinusIcon, PlusIcon } from './Icons'

interface QuantityStepperProps {
  quantity: number
  /** Estoque disponível. O botão de somar trava ao atingir o limite. */
  max: number
  productName: string
  tone?: 'solid' | 'ghost'
  onDecrease: () => void
  onIncrease: () => void
}

export function QuantityStepper({
  quantity,
  max,
  productName,
  tone = 'solid',
  onDecrease,
  onIncrease,
}: QuantityStepperProps) {
  const atLimit = quantity >= max

  return (
    <div className={`stepper stepper--${tone}`}>
      <button
        type="button"
        className="stepper__btn"
        onClick={onDecrease}
        aria-label={quantity === 1 ? `Remover ${productName} do pedido` : `Diminuir ${productName}`}
      >
        <MinusIcon />
      </button>
      <span className="stepper__value" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className="stepper__btn"
        onClick={onIncrease}
        disabled={atLimit}
        aria-label={`Aumentar ${productName}`}
        title={atLimit ? `Só há ${max} em estoque` : undefined}
      >
        <PlusIcon />
      </button>
    </div>
  )
}
