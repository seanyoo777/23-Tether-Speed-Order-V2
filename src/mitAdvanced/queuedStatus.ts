import type { QueuedStatus, StoredOrder } from '../types/tradingTypes.ts'
import { shouldFillMitStopAtPrice } from '../engine/mitStopEngine.ts'

export function resolveQueuedStatus(
  order: StoredOrder,
  lastPrice: number,
  prevPrice: number,
  tickSize: number,
): QueuedStatus {
  if (order.queuedStatus === 'TRIGGERED') return 'TRIGGERED'
  if (order.status === 'filled') return order.queuedStatus ?? 'FILLED'
  if (order.status === 'cancelled') return 'CANCELED'

  if (order.kind === 'MIT' || order.kind === 'STOP') {
    const near =
      Math.abs(order.triggerPrice - lastPrice) <= tickSize * 2 ||
      shouldFillMitStopAtPrice(
        order.triggerPrice,
        lastPrice,
        prevPrice,
        tickSize,
      )
    return near ? 'ARMED' : 'WAITING'
  }

  if (order.kind === 'PROTECTION_TP' || order.kind === 'PROTECTION_SL') {
    return 'ARMED'
  }

  return order.queuedStatus ?? 'WAITING'
}

export function badgeClass(status: QueuedStatus): string {
  return `qbadge qbadge-${status}`
}
