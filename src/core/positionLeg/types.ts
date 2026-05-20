import type { MockOnlyTagged } from '../contracts/mockOnly.ts'
import type { OrderIntent } from '../orderIntent/types.ts'
import type { CoreMarketType } from '../symbolSpec/types.ts'

export type PositionLeg = {
  legId: string
  symbol: string
  marketType: CoreMarketType
  side: 'LONG' | 'SHORT'
  qty: number
  avgPrice: number
  unrealizedPnl: number
  tpPrice?: number
  slPrice?: number
  reduceOnly: boolean
  closeIntent?: OrderIntent
} & MockOnlyTagged

/** Per-symbol hedge book — never collapse to netPosition. */
export type HedgePositionBook = {
  productKey: string
  symbol: string
  longLeg?: PositionLeg
  shortLeg?: PositionLeg
} & MockOnlyTagged

export function productKey(marketType: CoreMarketType, symbol: string): string {
  return `${marketType}:${symbol}`
}
