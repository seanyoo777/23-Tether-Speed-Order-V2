import type { ConditionalOrder } from './types.ts'

/** MIT/STOP trigger is fixed at registration — no last-price follow. */
export function assertTriggerLocked(order: ConditionalOrder): void {
  if (!order.locked) {
    throw new Error('Conditional order must be locked at trigger price')
  }
}

export function registerTriggerAtClick(
  order: ConditionalOrder,
  clickPrice: number,
): ConditionalOrder {
  return {
    ...order,
    triggerPrice: clickPrice,
    source: 'orderbook',
    locked: true,
  }
}

export function relockTriggerPrice(
  order: ConditionalOrder,
  nextPrice: number,
  source: 'orderbook' | 'manual',
): ConditionalOrder {
  return {
    ...order,
    triggerPrice: nextPrice,
    source,
    locked: true,
  }
}

/** Forbidden: auto-adjust trigger when market moves */
export function followMarketPrice(
  _order: ConditionalOrder,
  _lastPrice: number,
): ConditionalOrder {
  throw new Error('MIT triggerPrice auto-follow is forbidden')
}

export function shouldTrigger(
  order: ConditionalOrder,
  lastPrice: number,
  prevPrice: number,
): boolean {
  if (order.intent.includes('LONG') && order.intent.includes('OPEN')) {
    return lastPrice >= order.triggerPrice && prevPrice < order.triggerPrice
  }
  if (order.intent.includes('SHORT') && order.intent.includes('OPEN')) {
    return lastPrice <= order.triggerPrice && prevPrice > order.triggerPrice
  }
  return lastPrice === order.triggerPrice
}
