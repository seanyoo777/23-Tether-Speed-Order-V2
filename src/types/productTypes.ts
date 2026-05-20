import { resolveSymbolConfigForActive } from '../integration/symbolConfigBridge.ts'

/**
 * Engine `ProductType` — 5-product baseline (`docs/FIVE_PRODUCT_BASELINE.md`).
 * 국내선물 = 선물 종목군 + 국내 옵션(위클리·위클리먼데이·월물) 한 탭.
 */
export type ProductType =
  | 'KOREA_FUTURES'
  | 'OVERSEAS_FUTURES'
  | 'US_STOCK'
  | 'KOREA_STOCK'
  | 'COIN_FUTURES'

export const PRODUCT_LABELS: Record<ProductType, string> = {
  KOREA_FUTURES: '국내선물',
  OVERSEAS_FUTURES: '해외선물',
  US_STOCK: '해외주식',
  KOREA_STOCK: '국내주식',
  COIN_FUTURES: '코인',
}

/** UI tab order (5-product baseline). */
export const PRODUCT_TAB_ORDER: readonly ProductType[] = [
  'KOREA_FUTURES',
  'OVERSEAS_FUTURES',
  'US_STOCK',
  'KOREA_STOCK',
  'COIN_FUTURES',
]

export type PositionMode = 'hedge' | 'one_way'

/** Coin futures can toggle hedge mode; other product groups cannot. */
export function supportsHedgeMode(product: ProductType): boolean {
  return product === 'COIN_FUTURES'
}

/** Active dual-leg trading (coin + hedge toggle ON). */
export function useHedgeLegTrading(
  product: ProductType,
  hedgeMode: boolean,
): boolean {
  return supportsHedgeMode(product) && hedgeMode
}

export function positionModeForProduct(
  product: ProductType,
  hedgeMode: boolean,
): PositionMode {
  return useHedgeLegTrading(product, hedgeMode) ? 'hedge' : 'one_way'
}

/** 국내선물 — 선물 (kr_future). */
export type KoreaFutureContractSymbol =
  | 'KOSPI200F'
  | 'KOSPI200FM'
  | 'USDF'
  | 'KTB03F'

/** 국내선물 — 옵션 (option, KOSPI200 계열). */
export type KoreaDomesticOptionSymbol = 'K200W' | 'K200WM' | 'K200M'

export type KoreaFuturesSymbol =
  | KoreaFutureContractSymbol
  | KoreaDomesticOptionSymbol

export type CoinSymbol = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT'

export type OverseasFutureSymbol = 'ESZ6'

export type UsStockSymbol = 'AAPL'

export type KoreaStockSymbol = '005930'

export const KOREA_FUTURE_CONTRACT_SYMBOLS: readonly KoreaFutureContractSymbol[] =
  ['KOSPI200F', 'KOSPI200FM', 'USDF', 'KTB03F']

export const KOREA_DOMESTIC_OPTION_SYMBOLS: readonly KoreaDomesticOptionSymbol[] =
  ['K200W', 'K200WM', 'K200M']

export const KOREA_FUTURES_SYMBOLS: readonly KoreaFuturesSymbol[] = [
  ...KOREA_FUTURE_CONTRACT_SYMBOLS,
  ...KOREA_DOMESTIC_OPTION_SYMBOLS,
]

export const COIN_SYMBOLS: readonly CoinSymbol[] = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
]

export const OVERSEAS_FUTURES_SYMBOLS: readonly OverseasFutureSymbol[] = ['ESZ6']

export const US_STOCK_SYMBOLS: readonly UsStockSymbol[] = ['AAPL']

export const KOREA_STOCK_SYMBOLS: readonly KoreaStockSymbol[] = ['005930']

export const ENGINE_SYMBOLS_BY_PRODUCT: Record<
  ProductType,
  readonly string[]
> = {
  KOREA_FUTURES: KOREA_FUTURES_SYMBOLS,
  OVERSEAS_FUTURES: OVERSEAS_FUTURES_SYMBOLS,
  US_STOCK: US_STOCK_SYMBOLS,
  KOREA_STOCK: KOREA_STOCK_SYMBOLS,
  COIN_FUTURES: COIN_SYMBOLS,
}

export function isKoreaDomesticOptionSymbol(
  symbol: string,
): symbol is KoreaDomesticOptionSymbol {
  return (KOREA_DOMESTIC_OPTION_SYMBOLS as readonly string[]).includes(symbol)
}

export type SymbolConfig = {
  symbol: string
  basePrice: number
  tick: number
}

export const COIN_SYMBOL_CONFIG: Record<CoinSymbol, SymbolConfig> = {
  BTCUSDT: { symbol: 'BTCUSDT', basePrice: 97_420, tick: 0.5 },
  ETHUSDT: { symbol: 'ETHUSDT', basePrice: 3_480, tick: 0.05 },
  SOLUSDT: { symbol: 'SOLUSDT', basePrice: 172, tick: 0.01 },
}

export const OVERSEAS_SYMBOL_CONFIG: Record<
  OverseasFutureSymbol,
  SymbolConfig
> = {
  ESZ6: { symbol: 'ESZ6', basePrice: 5_800, tick: 0.25 },
}

export const US_STOCK_SYMBOL_CONFIG: Record<UsStockSymbol, SymbolConfig> = {
  AAPL: { symbol: 'AAPL', basePrice: 190, tick: 0.01 },
}

export const KOREA_STOCK_SYMBOL_CONFIG: Record<KoreaStockSymbol, SymbolConfig> = {
  '005930': { symbol: '005930', basePrice: 58_000, tick: 100 },
}

export const KOREA_FUTURES_SYMBOL_CONFIG: Record<KoreaFuturesSymbol, SymbolConfig> =
  {
    KOSPI200F: { symbol: 'KOSPI200F', basePrice: 385.5, tick: 0.05 },
    KOSPI200FM: { symbol: 'KOSPI200FM', basePrice: 385.5, tick: 0.05 },
    USDF: { symbol: 'USDF', basePrice: 1_385, tick: 0.1 },
    KTB03F: { symbol: 'KTB03F', basePrice: 108.25, tick: 0.01 },
    K200W: { symbol: 'K200W', basePrice: 5.2, tick: 0.05 },
    K200WM: { symbol: 'K200WM', basePrice: 4.85, tick: 0.05 },
    K200M: { symbol: 'K200M', basePrice: 6.1, tick: 0.05 },
  }

export const DEFAULT_SHARED_ORDER_QTY = 0.05

export function symbolsForProduct(product: ProductType): readonly string[] {
  return ENGINE_SYMBOLS_BY_PRODUCT[product] ?? []
}

export function isProductEngineReady(product: ProductType): boolean {
  return symbolsForProduct(product).length > 0
}

export function defaultSymbolForProduct(product: ProductType): string {
  return symbolsForProduct(product)[0] ?? 'BTCUSDT'
}

export function productComingSoonMessage(product: ProductType): string {
  return `${PRODUCT_LABELS[product]} — 준비중`
}

export function getSymbolConfig(
  symbol: string,
  product?: ProductType,
): SymbolConfig | undefined {
  if (product) {
    return resolveSymbolConfigForActive(product, symbol)
  }
  for (const p of PRODUCT_TAB_ORDER) {
    const cfg = resolveSymbolConfigForActive(p, symbol)
    if (cfg) return cfg
  }
  return undefined
}
