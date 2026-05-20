import { getSymbolConfig } from '../types/productTypes.ts'
import type { QueuedStatus, StoredOrder } from '../types/tradingTypes.ts'
import { resolveQueuedStatus } from './queuedStatus.ts'

export type AdvancedMarker = {
  id: string
  label: string
  kind: StoredOrder['kind']
  side: StoredOrder['side']
  triggerPrice: number
  qty: number
  status: QueuedStatus
  createdAt: number
  positionId?: string
}

const LABEL: Record<StoredOrder['kind'], string> = {
  LIMIT: 'LMT',
  MARKET: 'MKT',
  MIT: 'MIT',
  STOP: 'STP',
  PROTECTION_TP: 'TP',
  PROTECTION_SL: 'SL',
}

export function advancedMarkers(
  orders: readonly StoredOrder[],
  symbol: string,
  lastPrice: number,
  refPrice: number,
  tickSize = getSymbolConfig(symbol)?.tick ?? 0.5,
): AdvancedMarker[] {
  return orders
    .filter(
      (o) =>
        o.status === 'pending' &&
        o.symbol === symbol &&
        (o.kind === 'MIT' ||
          o.kind === 'STOP' ||
          o.kind === 'PROTECTION_TP' ||
          o.kind === 'PROTECTION_SL'),
    )
    .map((o) => ({
      id: o.id,
      label: LABEL[o.kind],
      kind: o.kind,
      side: o.side,
      triggerPrice: o.triggerPrice,
      qty: o.qty,
      status: resolveQueuedStatus(o, lastPrice, refPrice, tickSize),
      createdAt: o.createdAt,
      positionId: o.positionId,
    }))
}

export function advancedMarkersAtPrice(
  markers: readonly AdvancedMarker[],
  price: number,
  symbol: string,
): AdvancedMarker[] {
  const cfg = getSymbolConfig(symbol)
  const tol = cfg?.tick ?? 0.01
  return markers.filter((m) => Math.abs(m.triggerPrice - price) <= tol * 0.51)
}
