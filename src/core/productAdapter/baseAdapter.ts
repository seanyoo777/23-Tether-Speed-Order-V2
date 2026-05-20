import type { OrderIntent } from '../orderIntent/types.ts'
import { ALL_ORDER_INTENTS, filterIntentsForSpec } from '../orderIntent/validators.ts'
import { roundPrice, roundQty } from '../symbolSpec/engine.ts'
import type { SymbolSpec } from '../symbolSpec/types.ts'
import type { PnlContext, ProductAdapter } from './types.ts'
import type { CoreMarketType } from '../symbolSpec/types.ts'

export function createBaseAdapter(marketType: CoreMarketType): ProductAdapter {
  return {
    marketType,
    roundPrice,
    roundQty,
    bookPriceStep: (spec) => spec.tickSize,
    formatPrice: (spec, price) => price.toFixed(spec.priceDecimals),
    formatQty: (spec, qty) => qty.toFixed(spec.qtyDecimals),
    unrealizedPnl: (spec, ctx) => linearPnl(spec, ctx),
    allowedOrderIntents: (spec) => filterIntentsForSpec(ALL_ORDER_INTENTS, spec),
  }
}

function linearPnl(spec: SymbolSpec, ctx: PnlContext): number {
  const diff =
    ctx.side === 'LONG'
      ? ctx.markPrice - ctx.avgPrice
      : ctx.avgPrice - ctx.markPrice
  return diff * ctx.qty * spec.contractMultiplier
}

export function futuresTickPnl(spec: SymbolSpec, ctx: PnlContext): number {
  const ticks =
    (ctx.side === 'LONG'
      ? ctx.markPrice - ctx.avgPrice
      : ctx.avgPrice - ctx.markPrice) / spec.tickSize
  const tickValue =
    spec.contractMultiplier > 0
      ? (spec.tickSize * spec.contractMultiplier) / Math.max(spec.tickSize, 1e-12)
      : spec.tickSize
  return ticks * tickValue * ctx.qty
}

export function withAllowedIntents(
  adapter: ProductAdapter,
  picker: (spec: SymbolSpec) => OrderIntent[],
): ProductAdapter {
  return {
    ...adapter,
    allowedOrderIntents: picker,
  }
}
