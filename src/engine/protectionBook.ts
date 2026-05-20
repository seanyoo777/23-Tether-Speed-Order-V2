import type { PositionSide, StoredOrder } from '../types/tradingTypes.ts'
import type { OrderStore } from './orderStore.ts'

/** LONG: 위=TP·아래=SL / SHORT: 아래=TP·위=SL */
export function inferProtectionKindAtPrice(
  side: PositionSide,
  avgPrice: number,
  clickPrice: number,
): 'PROTECTION_TP' | 'PROTECTION_SL' {
  if (side === 'LONG') {
    return clickPrice >= avgPrice ? 'PROTECTION_TP' : 'PROTECTION_SL'
  }
  return clickPrice <= avgPrice ? 'PROTECTION_TP' : 'PROTECTION_SL'
}

export function cancelPendingProtectionForPosition(
  orders: OrderStore,
  positionId: string,
  kind?: 'PROTECTION_TP' | 'PROTECTION_SL',
): number {
  let n = 0
  for (const o of orders.listByPosition(positionId)) {
    if (o.status !== 'pending') continue
    if (o.kind !== 'PROTECTION_TP' && o.kind !== 'PROTECTION_SL') continue
    if (kind !== undefined && o.kind !== kind) continue
    if (orders.cancel(o.id)) n++
  }
  return n
}

export function pendingProtectionLabels(
  orders: readonly StoredOrder[],
  positionId: string,
): string {
  const p = orders.filter(
    (o) =>
      o.positionId === positionId &&
      o.status === 'pending' &&
      (o.kind === 'PROTECTION_TP' || o.kind === 'PROTECTION_SL'),
  )
  const parts: string[] = []
  if (p.some((o) => o.kind === 'PROTECTION_TP')) parts.push('TP')
  if (p.some((o) => o.kind === 'PROTECTION_SL')) parts.push('SL')
  return parts.join('·')
}

export function pendingMitStopForPosition(
  orders: readonly StoredOrder[],
  positionId: string,
): number {
  return orders.filter(
    (o) =>
      o.positionId === positionId &&
      o.status === 'pending' &&
      (o.kind === 'MIT' || o.kind === 'STOP'),
  ).length
}
