import { createBaseAdapter, futuresTickPnl } from './baseAdapter.ts'
import type { SymbolSpec } from '../symbolSpec/types.ts'
import type { PnlContext } from './types.ts'

const base = createBaseAdapter('overseas_future')

export const overseasFutureAdapter = {
  ...base,
  unrealizedPnl: (spec: SymbolSpec, ctx: PnlContext) => futuresTickPnl(spec, ctx),
}
