import type { ProductType } from '../types/productTypes.ts'
import type { PositionSide } from '../types/tradingTypes.ts'
import type { HedgeEngine } from './hedgeEngine.ts'
import type { PositionStore } from './positionStore.ts'

export type OneWayFillDeps = {
  hedge: HedgeEngine
  positions: PositionStore
}

/**
 * One-way fill: close opposite position first, then open/add remainder.
 *
 * @example Futures — LONG 20, then SELL 10 → close 10 long → net LONG 10
 * @example Stock — LONG 100 (buy), then SELL 130 → close 100 + open SHORT 30
 */
export function fillOneWayLeg(
  deps: OneWayFillDeps,
  input: {
    productType: ProductType
    symbol: string
    side: PositionSide
    qty: number
    fillPrice: number
    useHedgeLegs: boolean
  },
): { ok: true; positionId: string } {
  if (input.useHedgeLegs) {
    const leg = deps.hedge.openLeg({
      productType: input.productType,
      symbol: input.symbol,
      side: input.side,
      qty: input.qty,
      fillPrice: input.fillPrice,
    })
    return { ok: true, positionId: leg.positionId }
  }

  const opposite: PositionSide = input.side === 'LONG' ? 'SHORT' : 'LONG'
  let qtyLeft = input.qty

  const oppLeg = deps.positions
    .list()
    .find(
      (p) =>
        p.symbol === input.symbol &&
        p.side === opposite &&
        p.qty > 1e-12,
    )
  if (oppLeg && qtyLeft > 0) {
    const closeQty = Math.min(qtyLeft, oppLeg.qty)
    deps.hedge.closeQty(oppLeg.positionId, closeQty, input.fillPrice)
    qtyLeft -= closeQty
  }

  if (qtyLeft <= 1e-12) {
    return { ok: true, positionId: oppLeg?.positionId ?? 'one-way-flat' }
  }

  const sameLeg = deps.positions
    .list()
    .find(
      (p) =>
        p.symbol === input.symbol &&
        p.side === input.side &&
        p.qty > 1e-12,
    )
  if (sameLeg) {
    deps.hedge.addToLeg(sameLeg.positionId, qtyLeft, input.fillPrice)
    return { ok: true, positionId: sameLeg.positionId }
  }

  const leg = deps.hedge.openLeg({
    productType: input.productType,
    symbol: input.symbol,
    side: input.side,
    qty: qtyLeft,
    fillPrice: input.fillPrice,
  })
  return { ok: true, positionId: leg.positionId }
}
