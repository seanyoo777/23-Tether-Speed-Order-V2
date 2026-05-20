import type { QueuedStatus, StoredOrder } from '../types/tradingTypes.ts'

function isQueueKind(kind: StoredOrder['kind']): boolean {
  return (
    kind === 'MIT' ||
    kind === 'STOP' ||
    kind === 'PROTECTION_TP' ||
    kind === 'PROTECTION_SL'
  )
}

function nextSeqFromOrders(orders: readonly StoredOrder[]): number {
  let max = 0
  for (const o of orders) {
    const n = Number.parseInt(o.id.replace('ord-', ''), 10)
    if (Number.isFinite(n) && n >= max) max = n
  }
  return max + 1
}

export function createOrderStore() {
  let orderSeq = 1
  const orders: StoredOrder[] = []

  return {
    list(): readonly StoredOrder[] {
      return orders
    },

    get(id: string): StoredOrder | undefined {
      return orders.find((o) => o.id === id)
    },

    listPending(): StoredOrder[] {
      return orders.filter((o) => o.status === 'pending')
    },

    listPendingMitStop(symbol?: string): StoredOrder[] {
      return orders.filter(
        (o) =>
          o.status === 'pending' &&
          (o.kind === 'MIT' || o.kind === 'STOP') &&
          (symbol === undefined || o.symbol === symbol),
      )
    },

    listMitAdvanced(symbol?: string): StoredOrder[] {
      return orders.filter(
        (o) =>
          isQueueKind(o.kind) &&
          (symbol === undefined || o.symbol === symbol),
      )
    },

    listByPosition(positionId: string): StoredOrder[] {
      return orders.filter((o) => o.positionId === positionId)
    },

    add(
      input: Omit<StoredOrder, 'id' | 'status' | 'createdAt'> & {
        queuedStatus?: QueuedStatus
        status?: StoredOrder['status']
      },
    ): StoredOrder {
      const order: StoredOrder = {
        ...input,
        id: `ord-${orderSeq++}`,
        status: input.status ?? 'pending',
        createdAt: Date.now(),
        queuedStatus:
          input.queuedStatus ??
          (isQueueKind(input.kind) ? 'WAITING' : undefined),
      }
      orders.push(order)
      return order
    },

    replaceAll(items: readonly StoredOrder[]): void {
      orders.length = 0
      orders.push(...items.map((o) => ({ ...o })))
      orderSeq = nextSeqFromOrders(orders)
    },

    updateTriggerPrice(id: string, triggerPrice: number): boolean {
      const o = orders.find((x) => x.id === id)
      if (!o || o.status !== 'pending') return false
      o.triggerPrice = triggerPrice
      o.queuedStatus = 'WAITING'
      return true
    },

    setQueuedStatus(id: string, status: QueuedStatus): boolean {
      const o = orders.find((x) => x.id === id)
      if (!o) return false
      o.queuedStatus = status
      return true
    },

    markFilled(id: string): boolean {
      const o = orders.find((x) => x.id === id)
      if (!o || o.status !== 'pending') return false
      o.status = 'filled'
      o.queuedStatus = 'FILLED'
      return true
    },

    cancel(id: string): boolean {
      const o = orders.find((x) => x.id === id)
      if (!o || o.status !== 'pending') return false
      o.status = 'cancelled'
      o.queuedStatus = 'CANCELED'
      return true
    },

    cancelByPositionId(positionId: string): number {
      let n = 0
      for (const o of orders) {
        if (o.positionId !== positionId || o.status !== 'pending') continue
        o.status = 'cancelled'
        o.queuedStatus = 'CANCELED'
        n++
      }
      return n
    },

    cancelAllPending(symbol?: string, kinds?: StoredOrder['kind'][]): number {
      let n = 0
      for (const o of orders) {
        if (o.status !== 'pending') continue
        if (symbol !== undefined && o.symbol !== symbol) continue
        if (kinds !== undefined && !kinds.includes(o.kind)) continue
        o.status = 'cancelled'
        o.queuedStatus = 'CANCELED'
        n++
      }
      return n
    },
  }
}

export type OrderStore = ReturnType<typeof createOrderStore>
