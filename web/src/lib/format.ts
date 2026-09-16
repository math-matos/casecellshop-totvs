const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Converte centavos (inteiro, como a API envia) em texto de moeda. */
export function formatBRL(cents: number): string {
  return BRL.format(cents / 100)
}

export function hasDiscount(product: { priceInCents: number; compareAtPriceInCents?: number }): boolean {
  return (
    product.compareAtPriceInCents !== undefined && product.compareAtPriceInCents > product.priceInCents
  )
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}
