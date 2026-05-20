import { listSymbolSpecs } from '../core/symbolSpec/engine.ts'
import type { CoreMarketType } from '../core/symbolSpec/types.ts'
import type { ProductType } from '../types/productTypes.ts'
import { isProductEngineReady } from '../types/productTypes.ts'

export type WatchlistRow = {
  symbol: string
  displayName: string
  marketType: CoreMarketType
  tag: string
  tradable: boolean
}

const PRODUCT_MARKET: Partial<Record<ProductType, CoreMarketType>> = {
  KOREA_FUTURES: 'kr_future',
  OVERSEAS_FUTURES: 'overseas_future',
  US_STOCK: 'us_stock',
  KOREA_STOCK: 'kr_stock',
  COIN_FUTURES: 'coin',
  COIN_OPTIONS: 'option',
}

const TAG_BY_MARKET: Record<CoreMarketType, string> = {
  coin: 'COIN',
  kr_stock: 'STK',
  us_stock: 'STK',
  kr_future: 'FUT',
  overseas_future: 'FUT',
  option: 'OPT',
}

export function watchlistRowsForProduct(product: ProductType): WatchlistRow[] {
  const market = PRODUCT_MARKET[product]
  if (!market) {
    return previewRowsForComingSoon(product)
  }
  return listSymbolSpecs()
    .filter((s) => s.marketType === market)
    .map((s) => ({
      symbol: s.symbol,
      displayName: s.displayName,
      marketType: s.marketType,
      tag: TAG_BY_MARKET[s.marketType],
      tradable: isProductEngineReady(product),
    }))
}

/** Non-coin products: show labels only (not tradable in v1). */
function previewRowsForComingSoon(product: ProductType): WatchlistRow[] {
  const previews: Record<ProductType, WatchlistRow[]> = {
    KOREA_FUTURES: [],
    COIN_OPTIONS: [],
    COIN_FUTURES: [],
    OVERSEAS_FUTURES: [
      stub('ESZ6', 'E-mini S&P', 'overseas_future', 'FUT'),
      stub('GCZ6', 'Gold', 'overseas_future', 'FUT'),
    ],
    US_STOCK: [
      stub('AAPL', 'Apple', 'us_stock', 'STK'),
      stub('NVDA', 'NVIDIA', 'us_stock', 'STK'),
    ],
    KOREA_STOCK: [stub('005930', '삼성전자', 'kr_stock', 'STK')],
  }
  return previews[product] ?? []
}

function stub(
  symbol: string,
  displayName: string,
  marketType: CoreMarketType,
  tag: string,
): WatchlistRow {
  return { symbol, displayName, marketType, tag, tradable: false }
}
