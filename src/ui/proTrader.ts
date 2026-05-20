import type { StoredOrder } from '../types/tradingTypes.ts'
import { getSymbolConfig } from '../types/productTypes.ts'

export type LadderClickMode = 'single' | 'double'

export type OrderMarker = {
  id: string
  kind: StoredOrder['kind']
  label: string
  side: StoredOrder['side']
  triggerPrice: number
  qty: number
}

const KIND_LABEL: Record<StoredOrder['kind'], string> = {
  LIMIT: 'LMT',
  MARKET: 'MKT',
  MIT: 'MIT',
  STOP: 'STP',
  PROTECTION_TP: 'TP',
  PROTECTION_SL: 'SL',
}

export function markersForSymbol(
  orders: readonly StoredOrder[],
  symbol: string,
): OrderMarker[] {
  return orders
    .filter((o) => o.symbol === symbol && o.status === 'pending')
    .map((o) => ({
      id: o.id,
      kind: o.kind,
      label: KIND_LABEL[o.kind] ?? o.kind,
      side: o.side,
      triggerPrice: o.triggerPrice,
      qty: o.qty,
    }))
}

export function markersAtPrice(
  markers: readonly OrderMarker[],
  price: number,
  symbol: string,
): OrderMarker[] {
  const cfg = getSymbolConfig(symbol)
  const tol = cfg?.tick ?? 0.01
  return markers.filter((m) => Math.abs(m.triggerPrice - price) <= tol * 0.51)
}

export function sideLabel(side: StoredOrder['side']): 'BUY' | 'SELL' {
  return side === 'LONG' ? 'BUY' : 'SELL'
}

export function riskTier(pnlPct: number): '' | 'risk-3' | 'risk-5' | 'risk-10' {
  if (pnlPct <= -10) return 'risk-10'
  if (pnlPct <= -5) return 'risk-5'
  if (pnlPct <= -3) return 'risk-3'
  return ''
}

export const DEFAULT_QTY = 0.05

export type CompactMode = 'normal' | 'ultra'
