import type { Position } from '../types/tradingTypes.ts'
import { protectionPrices } from './pnlEngine.ts'
import type { OrderExecution } from './orderExecution.ts'
import type { OrderStore } from './orderStore.ts'

export function evaluateProtectionOnTick(
  orders: OrderStore,
  positions: readonly Position[],
  symbol: string,
  lastPrice: number,
  _tick: number,
): string[] {
  const filled: string[] = []
  for (const o of orders.listPending()) {
    if (o.kind !== 'PROTECTION_TP' && o.kind !== 'PROTECTION_SL') continue
    if (o.symbol !== symbol || !o.positionId) continue
    const pos = positions.find((p) => p.positionId === o.positionId)
    if (!pos) continue

    const hit =
      o.kind === 'PROTECTION_TP'
        ? pos.side === 'LONG'
          ? lastPrice >= o.triggerPrice
          : lastPrice <= o.triggerPrice
        : pos.side === 'LONG'
          ? lastPrice <= o.triggerPrice
          : lastPrice >= o.triggerPrice

    if (hit) filled.push(o.id)
  }
  return filled
}

export function registerProtectionForPosition(
  execution: OrderExecution,
  position: Position,
  tick: number,
  tpTicks: number,
  slTicks: number,
  protectPercent: 25 | 50 | 75 | 100,
): { tpOrderId: string; slOrderId: string; tpPrice: number; slPrice: number } {
  const qty = (position.qty * protectPercent) / 100
  const { tpPrice, slPrice } = protectionPrices(
    position.side,
    position.avgPrice,
    tick,
    tpTicks,
    slTicks,
  )
  const tpOrderId = execution.registerProtection({
    productType: position.productType,
    symbol: position.symbol,
    side: position.side,
    kind: 'PROTECTION_TP',
    triggerPrice: tpPrice,
    qty,
    positionId: position.positionId,
  })
  const slOrderId = execution.registerProtection({
    productType: position.productType,
    symbol: position.symbol,
    side: position.side,
    kind: 'PROTECTION_SL',
    triggerPrice: slPrice,
    qty,
    positionId: position.positionId,
  })
  return { tpOrderId, slOrderId, tpPrice, slPrice }
}
