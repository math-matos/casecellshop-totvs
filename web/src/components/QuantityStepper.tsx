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
  const solid = tone === 'solid'

  const wrap = `grid grid-cols-[auto_minmax(28px,1fr)_auto] items-center rounded-md ${
    solid
      ? 'mt-auto h-[42px] bg-brand px-1.5 text-sm text-white'
      : 'h-[30px] bg-surface-2 px-[3px] text-[13px] text-ink'
  }`
  const btn = `grid place-items-center rounded-[8px] border-0 bg-transparent p-0 transition-opacity disabled:opacity-40 ${
    solid ? 'size-8 hover:enabled:bg-white/[0.18]' : 'size-6 hover:enabled:bg-surface-3'
  }`
  const iconCls = solid ? 'size-[18px] shrink-0' : 'size-[14px] shrink-0'

  return (
    <div className={wrap}>
      <button
        type="button"
        className={btn}
        onClick={onDecrease}
        aria-label={quantity === 1 ? `Remover ${productName} do pedido` : `Diminuir ${productName}`}
      >
        <MinusIcon className={iconCls} />
      </button>
      <span className="text-center font-semibold tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className={btn}
        onClick={onIncrease}
        disabled={atLimit}
        aria-label={`Aumentar ${productName}`}
        title={atLimit ? `Só há ${max} em estoque` : undefined}
      >
        <PlusIcon className={iconCls} />
      </button>
    </div>
  )
}
