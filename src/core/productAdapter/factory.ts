import type { CoreMarketType } from '../symbolSpec/types.ts'
import { coinAdapter } from './coinAdapter.ts'
import { koreaFutureAdapter } from './koreaFutureAdapter.ts'
import { koreaStockAdapter } from './koreaStockAdapter.ts'
import { optionAdapter } from './optionAdapter.ts'
import { overseasFutureAdapter } from './overseasFutureAdapter.ts'
import type { ProductAdapter } from './types.ts'
import { usStockAdapter } from './usStockAdapter.ts'

const ADAPTERS: Record<CoreMarketType, ProductAdapter> = {
  coin: coinAdapter,
  kr_stock: koreaStockAdapter,
  us_stock: usStockAdapter,
  kr_future: koreaFutureAdapter,
  overseas_future: overseasFutureAdapter,
  option: optionAdapter,
}

export function getProductAdapter(marketType: CoreMarketType): ProductAdapter {
  return ADAPTERS[marketType]
}
