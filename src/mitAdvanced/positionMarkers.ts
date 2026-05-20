import type { Position } from '../types/tradingTypes.ts'

export type PositionMarker = {
  positionId: string
  side: Position['side']
  avgPrice: number
  qty: number
  label: string
}

export function positionMarkersForSymbol(
  positions: readonly Position[],
  symbol: string,
): PositionMarker[] {
  return positions
    .filter((p) => p.symbol === symbol && p.qty > 0)
    .map((p) => ({
      positionId: p.positionId,
      side: p.side,
      avgPrice: p.avgPrice,
      qty: p.qty,
      label: p.side === 'LONG' ? 'L' : 'S',
    }))
}

export function positionMarkersAtPrice(
  markers: readonly PositionMarker[],
  price: number,
  tick: number,
): PositionMarker[] {
  return markers.filter((m) => Math.abs(m.avgPrice - price) <= tick * 0.51)
}
