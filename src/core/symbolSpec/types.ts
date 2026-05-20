import type { MockOnlyTagged } from '../contracts/mockOnly.ts'

/** Canonical market discriminator for SymbolSpec + adapters. */
export type CoreMarketType =
  | 'coin'
  | 'kr_stock'
  | 'us_stock'
  | 'kr_future'
  | 'overseas_future'
  | 'option'

export type SymbolSpec = {
  symbol: string
  displayName: string
  marketType: CoreMarketType
  tickSize: number
  lotSize: number
  priceDecimals: number
  qtyDecimals: number
  contractMultiplier: number
  currency: string
  hedgeEnabled: boolean
  mitEnabled: boolean
  stopEnabled: boolean
  shortEnabled: boolean
  leverageEnabled: boolean
} & MockOnlyTagged

export const SYMBOL_SPEC_REQUIRED_KEYS = [
  'symbol',
  'displayName',
  'marketType',
  'tickSize',
  'lotSize',
  'priceDecimals',
  'qtyDecimals',
  'contractMultiplier',
  'currency',
  'hedgeEnabled',
  'mitEnabled',
  'stopEnabled',
  'shortEnabled',
  'leverageEnabled',
  'mockOnly',
] as const satisfies readonly (keyof SymbolSpec)[]
