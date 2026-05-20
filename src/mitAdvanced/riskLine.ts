import type { Position } from '../types/tradingTypes.ts'
import { getSymbolConfig } from '../types/productTypes.ts'

/** Mock liquidation price — display only, not engine settlement. */
export function mockLiquidationPrice(
  position: Position,
  markPrice: number,
): number {
  const cfg = getSymbolConfig(position.symbol)
  const tick = cfg?.tick ?? 0.5
  const lev = 10
  const buffer = (markPrice / lev) * (position.side === 'LONG' ? -1 : 1)
  return Number((position.avgPrice + buffer).toFixed(tick >= 1 ? 1 : 2))
}

export function riskLineForPositions(
  positions: readonly Position[],
  symbol: string,
  markPrice: number,
): number | null {
  const legs = positions.filter((p) => p.symbol === symbol && p.qty > 0)
  if (legs.length === 0) return null
  const liqs = legs.map((p) => mockLiquidationPrice(p, markPrice))
  if (legs.length === 1) return liqs[0]!
  const long = legs.find((p) => p.side === 'LONG')
  return long ? mockLiquidationPrice(long, markPrice) : liqs[0]!
}
