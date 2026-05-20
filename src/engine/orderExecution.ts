import type { ProductType } from '../types/productTypes.ts'
import type {
  ClosePercent,
  CoinOrderEntryKind,
  LadderDirection,
  LadderOrderColumn,
  PositionSide,
} from '../types/tradingTypes.ts'
import { ladderColumnToSide } from '../types/tradingTypes.ts'
import type { AuditEngine } from './auditEngine.ts'
import type { HedgeEngine } from './hedgeEngine.ts'
import { validateLadderDirection } from './hedgeEngine.ts'
import { fillHedgeExchange } from './hedgeExchangeFill.ts'
import { fillOneWayLeg } from './oneWayFill.ts'
import type { OrderStore } from './orderStore.ts'
import type { PositionStore } from './positionStore.ts'

export type ExecutionDeps = {
  hedge: HedgeEngine
  positions: PositionStore
  orders: OrderStore
  audit: AuditEngine
  getUseHedgeLegs: () => boolean
}

export function createOrderExecution(deps: ExecutionDeps) {
  return {
    fillHedgeExchange(input: {
      productType: ProductType
      symbol: string
      side: import('./hedgeExchangeFill.ts').ExchangeSide
      price: number
      qty: number
    }): { ok: true; positionId: string; action: string } {
      const result = fillHedgeExchange(
        { hedge: deps.hedge, positions: deps.positions },
        {
          productType: input.productType,
          symbol: input.symbol,
          side: input.side,
          qty: input.qty,
          fillPrice: input.price,
        },
      )
      const ordSide = input.side === 'buy' ? 'LONG' : 'SHORT'
      const ord = deps.orders.add({
        productType: input.productType,
        symbol: input.symbol,
        side: ordSide,
        kind: 'LIMIT',
        triggerPrice: input.price,
        qty: input.qty,
      })
      deps.orders.markFilled(ord.id)
      deps.audit.append('hedge.exchange', `${input.side} ${result.action} @ ${input.price}`)
      return result
    },

    closeHedgeLegOnBook(input: {
      symbol: string
      side: PositionSide
      price: number
    }): { ok: true; positionId: string } | { ok: false; message: string } {
      const leg = deps.positions
        .list()
        .find(
          (p) =>
            p.symbol === input.symbol &&
            p.side === input.side &&
            p.qty > 1e-12,
        )
      if (!leg) return { ok: false, message: '청산할 포지션이 없습니다.' }
      const r = deps.hedge.closeQty(leg.positionId, leg.qty, input.price)
      if (!r.ok) return r
      deps.audit.append('hedge.close.book', `${input.side} @ ${input.price}`)
      return { ok: true, positionId: leg.positionId }
    },

    /** Exchange-style panel: 시장가 / 지정가 · 매수 / 매도 (instant mock fill) */
    fillPanelOrder(input: {
      productType: ProductType
      symbol: string
      side: 'buy' | 'sell'
      entryKind: CoinOrderEntryKind
      price: number
      qty: number
    }): { ok: true; positionId: string } | { ok: false; message: string } {
      if (deps.getUseHedgeLegs()) {
        const ex = fillHedgeExchange(
          { hedge: deps.hedge, positions: deps.positions },
          {
            productType: input.productType,
            symbol: input.symbol,
            side: input.side,
            qty: input.qty,
            fillPrice: input.price,
          },
        )
        const ordSide = input.side === 'buy' ? 'LONG' : 'SHORT'
        const ord = deps.orders.add({
          productType: input.productType,
          symbol: input.symbol,
          side: ordSide,
          kind: input.entryKind === 'market' ? 'MARKET' : 'LIMIT',
          triggerPrice: input.price,
          qty: input.qty,
        })
        deps.orders.markFilled(ord.id)
        deps.audit.append(
          'panel.fill',
          `${input.entryKind} ${input.side} ${ex.action} @ ${input.price}`,
        )
        return { ok: true, positionId: ex.positionId }
      }

      const positionSide: PositionSide =
        input.side === 'buy' ? 'LONG' : 'SHORT'
      const { positionId } = fillOneWayLeg(
        { hedge: deps.hedge, positions: deps.positions },
        {
          productType: input.productType,
          symbol: input.symbol,
          side: positionSide,
          qty: input.qty,
          fillPrice: input.price,
          useHedgeLegs: false,
        },
      )
      const ord = deps.orders.add({
        productType: input.productType,
        symbol: input.symbol,
        side: positionSide,
        kind: input.entryKind === 'market' ? 'MARKET' : 'LIMIT',
        triggerPrice: input.price,
        qty: input.qty,
      })
      deps.orders.markFilled(ord.id)
      deps.audit.append(
        'panel.fill',
        `${input.entryKind} ${positionSide} ${input.qty} @ ${input.price}`,
      )
      return { ok: true, positionId }
    },

    /** Immediate mock fill from ladder limit click */
    fillLadderLimit(input: {
      productType: ProductType
      symbol: string
      ladderDirection: LadderDirection
      column: LadderOrderColumn
      price: number
      qty: number
    }): { ok: true; positionId: string } | { ok: false; message: string } {
      if (deps.getUseHedgeLegs()) {
        const exchangeSide = input.column === 'order-right' ? 'buy' : 'sell'
        const ex = fillHedgeExchange(
          { hedge: deps.hedge, positions: deps.positions },
          {
            productType: input.productType,
            symbol: input.symbol,
            side: exchangeSide,
            qty: input.qty,
            fillPrice: input.price,
          },
        )
        const ordSide = exchangeSide === 'buy' ? 'LONG' : 'SHORT'
        const ord = deps.orders.add({
          productType: input.productType,
          symbol: input.symbol,
          side: ordSide,
          kind: 'LIMIT',
          triggerPrice: input.price,
          qty: input.qty,
        })
        deps.orders.markFilled(ord.id)
        deps.audit.append(
          'hedge.exchange',
          `${exchangeSide} ${ex.action} @ ${input.price}`,
        )
        return { ok: true, positionId: ex.positionId }
      }

      const dir = validateLadderDirection(input.ladderDirection, input.column)
      if (!dir.ok) return dir

      const side = ladderColumnToSide(input.column)
      const { positionId } = fillOneWayLeg(
        { hedge: deps.hedge, positions: deps.positions },
        {
          productType: input.productType,
          symbol: input.symbol,
          side,
          qty: input.qty,
          fillPrice: input.price,
          useHedgeLegs: deps.getUseHedgeLegs(),
        },
      )

      const ord = deps.orders.add({
        productType: input.productType,
        symbol: input.symbol,
        side,
        kind: 'LIMIT',
        triggerPrice: input.price,
        qty: input.qty,
      })
      deps.orders.markFilled(ord.id)

      deps.audit.append('ladder.fill', `${side} ${input.qty} @ ${input.price}`)
      return { ok: true, positionId }
    },

    closePosition(
      positionId: string,
      percent: ClosePercent,
      fillPrice: number,
    ): ReturnType<HedgeEngine['closePercent']> {
      const result = deps.hedge.closePercent(positionId, percent, fillPrice)
      if (result.ok) {
        deps.audit.append('position.close', `${positionId} ${percent}%`)
      }
      return result
    },

    fillMitStopOrder(
      orderId: string,
      fillPrice: number,
    ): { ok: boolean; positionId?: string } {
      const order = deps.orders.list().find((o) => o.id === orderId)
      if (!order || order.status !== 'pending') return { ok: false }

      deps.orders.markFilled(orderId)
      if (order.positionId) {
        const closed = deps.hedge.closeQty(
          order.positionId,
          order.qty,
          fillPrice,
        )
        if (!closed.ok) return { ok: false }
        deps.audit.append(
          'mit_stop.fill',
          `close ${order.kind} ${order.side} @ ${fillPrice}`,
        )
        return { ok: true, positionId: order.positionId }
      }
      const { positionId } = fillOneWayLeg(
        { hedge: deps.hedge, positions: deps.positions },
        {
          productType: order.productType,
          symbol: order.symbol,
          side: order.side,
          qty: order.qty,
          fillPrice,
          useHedgeLegs: deps.getUseHedgeLegs(),
        },
      )
      deps.audit.append('mit_stop.fill', `${order.kind} ${order.side} @ ${fillPrice}`)
      return { ok: true, positionId }
    },

    registerProtection(input: {
      productType: ProductType
      symbol: string
      side: PositionSide
      kind: 'PROTECTION_TP' | 'PROTECTION_SL'
      triggerPrice: number
      qty: number
      positionId: string
    }): string {
      const o = deps.orders.add({
        ...input,
        triggerPrice: input.triggerPrice,
      })
      deps.audit.append('protection.register', `${input.kind} @ ${input.triggerPrice}`)
      return o.id
    },
  }
}

export type OrderExecution = ReturnType<typeof createOrderExecution>
