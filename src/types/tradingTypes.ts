import type { ProductType } from './productTypes.ts'

export type PositionSide = 'LONG' | 'SHORT'

/** 매수전환 / 매도전환 — ladder new-order direction lock */
export type LadderDirection = 'buy' | 'sell'

/** HTS ladder column for click routing */
export type LadderOrderColumn = 'order-left' | 'order-right'

export type OrderKind =
  | 'LIMIT'
  | 'MARKET'
  | 'MIT'
  | 'STOP'
  | 'PROTECTION_TP'
  | 'PROTECTION_SL'

/** 우측 주문창 — 시장가 / 지정가 */
export type CoinOrderEntryKind = 'market' | 'limit'

export type OrderStatus = 'pending' | 'filled' | 'cancelled'

/** MIT/STOP/TP/SL queue display (Phase MIT Advanced) */
export type QueuedStatus =
  | 'WAITING'
  | 'ARMED'
  | 'TRIGGERED'
  | 'PARTIAL'
  | 'FILLED'
  | 'CANCELED'

export type LiquidityRole = 'maker' | 'taker'

export type ClosePercent = 25 | 50 | 75 | 100

export type Position = {
  positionId: string
  productType: ProductType
  symbol: string
  side: PositionSide
  qty: number
  avgPrice: number
  createdAt: number
  realizedPnl: number
}

export type StoredOrder = {
  id: string
  productType: ProductType
  symbol: string
  side: PositionSide
  kind: OrderKind
  status: OrderStatus
  triggerPrice: number
  qty: number
  positionId?: string
  createdAt: number
  queuedStatus?: QueuedStatus
  /** Mock order-flow metadata (PHASE_REALISTIC_ORDER_FLOW) */
  filledQty?: number
  liquidityRole?: LiquidityRole
  slippageTicks?: number
  queuePriority?: number
  flowTag?: string
}

export type AuditEntry = {
  id: string
  action: string
  detail: string
  at: number
}

export const MSG_BUY_MODE_BLOCK =
  '현재 매수전환 상태입니다. 매도 주문은 매도전환 후 가능합니다.'
export const MSG_SELL_MODE_BLOCK =
  '현재 매도전환 상태입니다. 매수 주문은 매수전환 후 가능합니다.'
export const MSG_LADDER_CLOSE_FORBIDDEN =
  '청산은 하단 포지션 행의 청산 버튼으로만 가능합니다.'

export function buildPositionId(
  productType: ProductType,
  symbol: string,
  side: PositionSide,
  createdAt: number,
): string {
  return `${productType}:${symbol}:${side}:${createdAt}`
}

export function ladderColumnToSide(column: LadderOrderColumn): PositionSide {
  return column === 'order-right' ? 'LONG' : 'SHORT'
}
