export type ClaimResult =
  | { kind: 'acquired' }
  | { kind: 'in_progress' }
  | { kind: 'completed'; orderId: string; requestHash: string }

export interface IdempotencyStore {
  claim(key: string, requestHash: string): Promise<ClaimResult>
  complete(key: string, orderId: string): Promise<void>
  release(key: string): Promise<void>
}

type Entry =
  | { status: 'in_progress'; requestHash: string }
  | { status: 'completed'; requestHash: string; orderId: string }

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly entries = new Map<string, Entry>()

  async claim(key: string, requestHash: string): Promise<ClaimResult> {
    const existing = this.entries.get(key)

    if (!existing) {
      this.entries.set(key, { status: 'in_progress', requestHash })
      return { kind: 'acquired' }
    }

    if (existing.status === 'in_progress') {
      return { kind: 'in_progress' }
    }

    return { kind: 'completed', orderId: existing.orderId, requestHash: existing.requestHash }
  }

  async complete(key: string, orderId: string): Promise<void> {
    const existing = this.entries.get(key)
    if (!existing) return
    this.entries.set(key, { status: 'completed', requestHash: existing.requestHash, orderId })
  }

  async release(key: string): Promise<void> {
    const existing = this.entries.get(key)
    if (existing?.status === 'in_progress') {
      this.entries.delete(key)
    }
  }
}
