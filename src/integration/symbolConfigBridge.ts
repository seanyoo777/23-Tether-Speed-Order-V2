/**
 * Product-aware SymbolSpec bridge (mock). Coin + overseas futures phase 2.
 * No 02-TGX-CEX import.
 */
import { getProductAdapter } from '../core/productAdapter/factory.ts'
import type { CoreMarketType, SymbolSpec } from '../core/symbolSpec/types.ts'
import { getSymbolSpec, requireSymbolSpec, roundPrice, roundQty } from '../core/symbolSpec/index.ts'
import type { ProductType, SymbolConfig } from '../types/productTypes.ts'
import { supportsHedgeMode } from '../types/productTypes.ts'
import {
  COIN_SYMBOL_CONFIG,
  ENGINE_SYMBOLS_BY_PRODUCT,
  OVERSEAS_SYMBOL_CONFIG,
  US_STOCK_SYMBOL_CONFIG,
  KOREA_STOCK_SYMBOL_CONFIG,
  KOREA_FUTURES_SYMBOL_CONFIG,
  COIN_OPTIONS_SYMBOL_CONFIG,
  symbolsForProduct,
} from '../types/productTypes.ts'

export function productTypeToCoreMarket(product: ProductType): CoreMarketType | null {
  const map: Partial<Record<ProductType, CoreMarketType>> = {
    KOREA_FUTURES: 'kr_future',
    OVERSEAS_FUTURES: 'overseas_future',
    US_STOCK: 'us_stock',
    KOREA_STOCK: 'kr_stock',
    COIN_FUTURES: 'coin',
    COIN_OPTIONS: 'option',
  }
  return map[product] ?? null
}

export function isEngineSymbol(product: ProductType, symbol: string): boolean {
  return (ENGINE_SYMBOLS_BY_PRODUCT[product] as readonly string[]).includes(
    symbol,
  )
}

export function isProductBridgeReady(
  product: ProductType,
  symbol: string,
): boolean {
  if (!isEngineSymbol(product, symbol)) return false
  const market = productTypeToCoreMarket(product)
  if (!market) return false
  const spec = getSymbolSpec(symbol)
  return spec?.marketType === market
}

export function getCoreSpec(
  product: ProductType,
  symbol: string,
): SymbolSpec | undefined {
  if (!isProductBridgeReady(product, symbol)) return undefined
  return getSymbolSpec(symbol)
}

function seedConfig(product: ProductType, symbol: string): SymbolConfig | undefined {
  if (product === 'COIN_FUTURES' && symbol in COIN_SYMBOL_CONFIG) {
    return COIN_SYMBOL_CONFIG[symbol as keyof typeof COIN_SYMBOL_CONFIG]
  }
  if (product === 'OVERSEAS_FUTURES' && symbol in OVERSEAS_SYMBOL_CONFIG) {
    return OVERSEAS_SYMBOL_CONFIG[symbol as keyof typeof OVERSEAS_SYMBOL_CONFIG]
  }
  if (product === 'US_STOCK' && symbol in US_STOCK_SYMBOL_CONFIG) {
    return US_STOCK_SYMBOL_CONFIG[symbol as keyof typeof US_STOCK_SYMBOL_CONFIG]
  }
  if (product === 'KOREA_STOCK' && symbol in KOREA_STOCK_SYMBOL_CONFIG) {
    return KOREA_STOCK_SYMBOL_CONFIG[symbol as keyof typeof KOREA_STOCK_SYMBOL_CONFIG]
  }
  if (product === 'KOREA_FUTURES' && symbol in KOREA_FUTURES_SYMBOL_CONFIG) {
    return KOREA_FUTURES_SYMBOL_CONFIG[
      symbol as keyof typeof KOREA_FUTURES_SYMBOL_CONFIG
    ]
  }
  if (product === 'COIN_OPTIONS' && symbol in COIN_OPTIONS_SYMBOL_CONFIG) {
    return COIN_OPTIONS_SYMBOL_CONFIG[
      symbol as keyof typeof COIN_OPTIONS_SYMBOL_CONFIG
    ]
  }
  return undefined
}

export function resolveProductSymbolConfig(
  product: ProductType,
  symbol: string,
): SymbolConfig | undefined {
  const seed = seedConfig(product, symbol)
  const spec = getCoreSpec(product, symbol)
  if (!seed && !spec) return undefined
  if (!spec) return seed
  return {
    symbol,
    basePrice: seed?.basePrice ?? 0,
    tick: spec.tickSize,
  }
}

export function resolveSymbolConfigForActive(
  product: ProductType,
  symbol: string,
): SymbolConfig | undefined {
  const primary = resolveProductSymbolConfig(product, symbol)
  if (primary) return primary
  return resolveProductSymbolConfig('COIN_FUTURES', symbol)
}

export type BridgeMeta = {
  symbol: string
  displayName: string
  tickSize: number
  lotSize: number
  currency: string
  hedgeEnabled: boolean
  mitEnabled: boolean
}

export function getBridgeMeta(
  product: ProductType,
  symbol: string,
): BridgeMeta | null {
  const spec = getCoreSpec(product, symbol)
  if (!spec) return null
  return {
    symbol: spec.symbol,
    displayName: spec.displayName,
    tickSize: spec.tickSize,
    lotSize: spec.lotSize,
    currency: spec.currency,
    hedgeEnabled: supportsHedgeMode(product) && spec.hedgeEnabled,
    mitEnabled: spec.mitEnabled,
  }
}

export function formatBridgePrice(
  _product: ProductType,
  symbol: string,
  price: number,
): string {
  const spec = requireSymbolSpec(symbol)
  const adapter = getProductAdapter(spec.marketType)
  return adapter.formatPrice(spec, roundPrice(spec, price))
}

export function roundBridgePrice(
  product: ProductType,
  symbol: string,
  price: number,
): number {
  const spec = getCoreSpec(product, symbol)
  if (!spec) return price
  return roundPrice(spec, price)
}

export function roundBridgeQty(
  product: ProductType,
  symbol: string,
  qty: number,
): number {
  const spec = getCoreSpec(product, symbol)
  if (!spec) return qty
  return roundQty(spec, qty)
}

export function allEngineTickerSymbols(): string[] {
  const set = new Set<string>()
  for (const p of Object.keys(ENGINE_SYMBOLS_BY_PRODUCT) as ProductType[]) {
    for (const s of symbolsForProduct(p)) set.add(s)
  }
  return [...set]
}
