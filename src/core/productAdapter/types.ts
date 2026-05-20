import type { OrderIntent } from '../orderIntent/types.ts'
import type { CoreMarketType, SymbolSpec } from '../symbolSpec/types.ts'

export type PnlContext = {
  side: 'LONG' | 'SHORT'
  qty: number
  avgPrice: number
  markPrice: number
}

export type ProductAdapter = {
  readonly marketType: CoreMarketType
  roundPrice(spec: SymbolSpec, price: number): number
  roundQty(spec: SymbolSpec, qty: number): number
  bookPriceStep(spec: SymbolSpec): number
  formatPrice(spec: SymbolSpec, price: number): string
  formatQty(spec: SymbolSpec, qty: number): string
  unrealizedPnl(spec: SymbolSpec, ctx: PnlContext): number
  allowedOrderIntents(spec: SymbolSpec): OrderIntent[]
}
