import type { PositionSide } from '../types/tradingTypes.ts'
import type { OrderStore } from './orderStore.ts'

export type MitStopTrigger = {
  orderId: string
  side: PositionSide
  triggerPrice: number
  kind: 'MIT' | 'STOP'
}

/**
 * MIT ≡ STOP — 돌파·손절·익절 대기 공통.
 * 상·하 돌파 동일: trigger 가격 도달(터치 또는 양방향 돌파).
 */
export function shouldFillMitStopAtPrice(
  triggerPrice: number,
  lastPrice: number,
  prevPrice: number,
  tickSize: number,
): boolean {
  const tol = Math.max(tickSize * 0.51, 1e-12)
  if (Math.abs(lastPrice - triggerPrice) <= tol) return true
  if (prevPrice === lastPrice) return false
  const crossedUp = prevPrice < triggerPrice && lastPrice >= triggerPrice
  const crossedDown = prevPrice > triggerPrice && lastPrice <= triggerPrice
  return crossedUp || crossedDown
}

/** @deprecated MIT ≡ STOP — use shouldFillMitStopAtPrice */
export function shouldFillMit(
  _side: PositionSide,
  triggerPrice: number,
  lastPrice: number,
  refPrice: number,
  tickSize = 0.5,
): boolean {
  return shouldFillMitStopAtPrice(triggerPrice, lastPrice, refPrice, tickSize)
}

export function evaluateMitStopOnTick(
  orders: OrderStore,
  symbol: string,
  lastPrice: number,
  prevPrice: number,
  tickSize: number,
): MitStopTrigger[] {
  const triggered: MitStopTrigger[] = []
  for (const o of orders.listPendingMitStop(symbol)) {
    if (o.kind !== 'MIT' && o.kind !== 'STOP') continue
    const hit = shouldFillMitStopAtPrice(
      o.triggerPrice,
      lastPrice,
      prevPrice,
      tickSize,
    )
    if (hit) {
      triggered.push({
        orderId: o.id,
        side: o.side,
        triggerPrice: o.triggerPrice,
        kind: o.kind,
      })
    }
  }
  return triggered
}

export function registerMitOrder(
  orders: OrderStore,
  input: {
    productType: import('../types/productTypes.ts').ProductType
    symbol: string
    side: PositionSide
    triggerPrice: number
    qty: number
    kind: 'MIT' | 'STOP'
    positionId?: string
  },
): string {
  const o = orders.add({
    productType: input.productType,
    symbol: input.symbol,
    side: input.side,
    kind: input.kind,
    triggerPrice: input.triggerPrice,
    qty: input.qty,
    positionId: input.positionId,
    queuedStatus: 'WAITING',
  })
  return o.id
}
