import { getCoreSpec } from '../integration/symbolConfigBridge.ts'
import { getProductAdapter } from '../core/productAdapter/factory.ts'
import type { Position, PositionSide } from '../types/tradingTypes.ts'

function sideSign(side: PositionSide): number {
  return side === 'LONG' ? 1 : -1
}

export function unrealizedPnl(
  leg: Pick<Position, 'side' | 'qty' | 'avgPrice'> &
    Partial<Pick<Position, 'productType' | 'symbol'>>,
  markPrice: number,
): number {
  if (leg.qty <= 0) return 0
  if (
    leg.productType &&
    leg.productType !== 'COIN_FUTURES' &&
    leg.symbol
  ) {
    const spec = getCoreSpec(leg.productType, leg.symbol)
    if (spec) {
      return getProductAdapter(spec.marketType).unrealizedPnl(spec, {
        side: leg.side,
        qty: leg.qty,
        avgPrice: leg.avgPrice,
        markPrice,
      })
    }
  }
  return (markPrice - leg.avgPrice) * leg.qty * sideSign(leg.side)
}

export function pnlPercent(
  leg: Pick<Position, 'side' | 'avgPrice'>,
  markPrice: number,
): number {
  if (leg.avgPrice === 0) return 0
  const raw =
    leg.side === 'LONG'
      ? ((markPrice - leg.avgPrice) / leg.avgPrice) * 100
      : ((leg.avgPrice - markPrice) / leg.avgPrice) * 100
  return raw
}

export function sumUnrealized(legs: readonly Position[], markPrice: number): number {
  return legs.reduce((s, l) => s + unrealizedPnl(l, markPrice), 0)
}

export function sumRealized(legs: readonly Position[]): number {
  return legs.reduce((s, l) => s + l.realizedPnl, 0)
}

/** Auto TP/SL price from ticks */
export function protectionPrices(
  side: PositionSide,
  avgPrice: number,
  tick: number,
  tpTicks: number,
  slTicks: number,
): { tpPrice: number; slPrice: number } {
  if (side === 'LONG') {
    return {
      tpPrice: avgPrice + tick * tpTicks,
      slPrice: avgPrice - tick * slTicks,
    }
  }
  return {
    tpPrice: avgPrice - tick * tpTicks,
    slPrice: avgPrice + tick * slTicks,
  }
}
