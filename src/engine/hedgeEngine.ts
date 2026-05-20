import type { ProductType } from '../types/productTypes.ts'
import type {
  ClosePercent,
  LadderDirection,
  LadderOrderColumn,
  Position,
  PositionSide,
} from '../types/tradingTypes.ts'
import {
  MSG_BUY_MODE_BLOCK,
  MSG_SELL_MODE_BLOCK,
  buildPositionId,
} from '../types/tradingTypes.ts'
import type { PositionStore } from './positionStore.ts'

export type RuleResult = { ok: true } | { ok: false; message: string }

export type HedgeEngineDeps = {
  positions: PositionStore
}

/** Hedge legs — no LONG/SHORT netting. */
export function createHedgeEngine(deps: HedgeEngineDeps) {
  return {
    openLeg(input: {
      productType: ProductType
      symbol: string
      side: PositionSide
      qty: number
      fillPrice: number
      createdAt?: number
    }): Position {
      const createdAt = input.createdAt ?? Date.now()
      const positionId = buildPositionId(
        input.productType,
        input.symbol,
        input.side,
        createdAt,
      )
      const leg: Position = {
        positionId,
        productType: input.productType,
        symbol: input.symbol,
        side: input.side,
        qty: input.qty,
        avgPrice: input.fillPrice,
        createdAt,
        realizedPnl: 0,
      }
      deps.positions.upsert(leg)
      return leg
    },

    addToLeg(positionId: string, addQty: number, fillPrice: number): Position | undefined {
      const leg = deps.positions.get(positionId)
      if (!leg) return undefined
      const totalQty = leg.qty + addQty
      const avgPrice =
        (leg.avgPrice * leg.qty + fillPrice * addQty) / totalQty
      const next: Position = { ...leg, qty: totalQty, avgPrice }
      deps.positions.upsert(next)
      return next
    },

    closePercent(
      positionId: string,
      percent: ClosePercent,
      fillPrice: number,
    ): RuleResult & { position?: Position; closedQty?: number } {
      const leg = deps.positions.get(positionId)
      if (!leg || leg.qty <= 0) {
        return { ok: false, message: '청산할 포지션을 찾을 수 없습니다.' }
      }
      const closeQty = (leg.qty * percent) / 100
      return this.closeQty(positionId, closeQty, fillPrice)
    },

    closeQty(
      positionId: string,
      closeQty: number,
      fillPrice: number,
    ): RuleResult & { position?: Position; closedQty?: number } {
      const leg = deps.positions.get(positionId)
      if (!leg || leg.qty <= 0) {
        return { ok: false, message: '청산할 포지션을 찾을 수 없습니다.' }
      }
      const qty = Math.min(closeQty, leg.qty)
      if (qty <= 0) {
        return { ok: false, message: '청산 수량이 올바르지 않습니다.' }
      }

      const sign = leg.side === 'LONG' ? 1 : -1
      const realizedDelta = (fillPrice - leg.avgPrice) * qty * sign
      const remaining = leg.qty - qty

      if (remaining <= 1e-12) {
        deps.positions.remove(positionId)
        return {
          ok: true,
          closedQty: qty,
          position: { ...leg, qty: 0, realizedPnl: leg.realizedPnl + realizedDelta },
        }
      }

      const next: Position = {
        ...leg,
        qty: remaining,
        realizedPnl: leg.realizedPnl + realizedDelta,
      }
      deps.positions.upsert(next)
      return { ok: true, position: next, closedQty: qty }
    },
  }
}

export type HedgeEngine = ReturnType<typeof createHedgeEngine>

export function validateLadderDirection(
  ladderDirection: LadderDirection,
  column: LadderOrderColumn,
): RuleResult {
  if (ladderDirection === 'buy' && column === 'order-left') {
    return { ok: false, message: MSG_BUY_MODE_BLOCK }
  }
  if (ladderDirection === 'sell' && column === 'order-right') {
    return { ok: false, message: MSG_SELL_MODE_BLOCK }
  }
  return { ok: true }
}
