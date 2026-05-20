import type { ProductType } from '../types/productTypes.ts'
import type { PositionSide } from '../types/tradingTypes.ts'
import type { HedgeEngine } from './hedgeEngine.ts'
import type { PositionStore } from './positionStore.ts'

export type ExchangeSide = 'buy' | 'sell'

export type HedgeExchangeFillDeps = {
  hedge: HedgeEngine
  positions: PositionStore
}

function legQty(
  positions: PositionStore,
  symbol: string,
  side: PositionSide,
): { positionId: string; qty: number } | null {
  const leg = positions
    .list()
    .find((p) => p.symbol === symbol && p.side === side && p.qty > 1e-12)
  if (!leg) return null
  return { positionId: leg.positionId, qty: leg.qty }
}

/**
 * Coin hedge — exchange-style buy/sell on ladder or panel.
 * - Buy: close SHORT (if any), else open/add LONG
 * - Sell: open/add SHORT (진입) — 롱 청산은 호가 「청산」 버튼
 */
export function fillHedgeExchange(
  deps: HedgeExchangeFillDeps,
  input: {
    productType: ProductType
    symbol: string
    side: ExchangeSide
    qty: number
    fillPrice: number
  },
): { ok: true; positionId: string; action: string } {
  let qtyLeft = input.qty
  let lastId = 'hedge-exchange'
  const actions: string[] = []

  if (input.side === 'buy') {
    const short = legQty(deps.positions, input.symbol, 'SHORT')
    if (short && qtyLeft > 0) {
      const closeQty = Math.min(qtyLeft, short.qty)
      deps.hedge.closeQty(short.positionId, closeQty, input.fillPrice)
      qtyLeft -= closeQty
      actions.push(`CLOSE_SHORT ${closeQty}`)
      lastId = short.positionId
    }
    if (qtyLeft > 1e-12) {
      const long = legQty(deps.positions, input.symbol, 'LONG')
      if (long) {
        deps.hedge.addToLeg(long.positionId, qtyLeft, input.fillPrice)
        actions.push(`OPEN_LONG +${qtyLeft}`)
        lastId = long.positionId
      } else {
        const leg = deps.hedge.openLeg({
          productType: input.productType,
          symbol: input.symbol,
          side: 'LONG',
          qty: qtyLeft,
          fillPrice: input.fillPrice,
        })
        actions.push(`OPEN_LONG ${qtyLeft}`)
        lastId = leg.positionId
      }
    }
    return { ok: true, positionId: lastId, action: actions.join(' · ') }
  }

  const short = legQty(deps.positions, input.symbol, 'SHORT')
  if (short) {
    deps.hedge.addToLeg(short.positionId, qtyLeft, input.fillPrice)
    actions.push(`OPEN_SHORT +${qtyLeft}`)
    lastId = short.positionId
  } else {
    const leg = deps.hedge.openLeg({
      productType: input.productType,
      symbol: input.symbol,
      side: 'SHORT',
      qty: qtyLeft,
      fillPrice: input.fillPrice,
    })
    actions.push(`OPEN_SHORT ${qtyLeft}`)
    lastId = leg.positionId
  }
  return { ok: true, positionId: lastId, action: actions.join(' · ') }
}

/** Close entire leg at price (ladder 청산 button). */
export function closeHedgeLegAtPrice(
  deps: HedgeExchangeFillDeps,
  input: {
    symbol: string
    side: PositionSide
    fillPrice: number
  },
): { ok: true; positionId: string } | { ok: false; message: string } {
  const leg = legQty(deps.positions, input.symbol, input.side)
  if (!leg) {
    return { ok: false, message: '청산할 포지션이 없습니다.' }
  }
  deps.hedge.closeQty(leg.positionId, leg.qty, input.fillPrice)
  return { ok: true, positionId: leg.positionId }
}
