import type { CoinSymbol } from '../types/productTypes.ts'
import { COIN_SYMBOL_CONFIG } from '../types/productTypes.ts'
import type { TradingSession } from '../engine/tradingSession.ts'
import type { TabSessionSnapshot } from './sessionPersistence.ts'

export function exportTabSession(
  session: TradingSession,
  tabId: string,
  symbol: CoinSymbol,
): TabSessionSnapshot {
  const { positions, orders, audit, ticker } = session._engines
  const orderList = [...orders.list()]
  let orderSeq = 1
  for (const o of orderList) {
    const n = Number.parseInt(o.id.replace('ord-', ''), 10)
    if (Number.isFinite(n) && n >= orderSeq) orderSeq = n + 1
  }
  const auditList = [...audit.list()]
  let auditSeq = 1
  for (const a of auditList) {
    const n = Number.parseInt(a.id.replace('audit-', ''), 10)
    if (Number.isFinite(n) && n >= auditSeq) auditSeq = n + 1
  }

  return {
    tabId,
    symbol,
    state: session.getState(),
    positions: positions.list(),
    orders: orderList,
    audits: auditList,
    lastPrice: ticker.getLastPrice(symbol),
    orderSeq,
    auditSeq,
  }
}

export function hydrateTabSession(
  session: TradingSession,
  snap: TabSessionSnapshot,
): void {
  const { positions, orders, audit, ticker } = session._engines

  positions.replaceAll(snap.positions)
  orders.replaceAll(snap.orders)
  audit.replaceAll(snap.audits)

  const st = snap.state
  session.setProduct(st.productType)
  session.setSymbol(st.symbol)
  session.setSharedOrderQty(st.sharedOrderQty)
  session.setLadderDirection(st.ladderDirection)
  session.setSelectedPositionId(st.selectedPositionId)
  session.setLadderPinned(st.ladderPinned)
  if (st.hedgeMode) session.setHedgeMode(true)
  if (st.orderEntryKind) session.setOrderEntryKind(st.orderEntryKind)
  if (st.limitEntryPrice > 0) session.setLimitEntryPrice(st.limitEntryPrice)

  ticker.manualTick(
    snap.symbol,
    snap.lastPrice ?? COIN_SYMBOL_CONFIG[snap.symbol].basePrice,
  )
}
