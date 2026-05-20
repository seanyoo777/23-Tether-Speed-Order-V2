import { tagMockOnly } from '../contracts/mockOnly.ts'
import type { CoreMarketType, SymbolSpec } from './types.ts'
import { SYMBOL_SPEC_REQUIRED_KEYS } from './types.ts'

export function isCoreMarketType(v: string): v is CoreMarketType {
  return (
    v === 'coin' ||
    v === 'kr_stock' ||
    v === 'us_stock' ||
    v === 'kr_future' ||
    v === 'overseas_future' ||
    v === 'option'
  )
}

export function validateSymbolSpec(spec: SymbolSpec): string[] {
  const errors: string[] = []
  for (const key of SYMBOL_SPEC_REQUIRED_KEYS) {
    if (!(key in spec)) errors.push(`missing:${key}`)
  }
  if (!isCoreMarketType(spec.marketType)) errors.push('invalid:marketType')
  if (!Number.isFinite(spec.tickSize) || spec.tickSize <= 0) errors.push('invalid:tickSize')
  if (!Number.isFinite(spec.lotSize) || spec.lotSize <= 0) errors.push('invalid:lotSize')
  if (spec.mockOnly !== true) errors.push('invalid:mockOnly')
  return errors
}

export function mergeSymbolSpec(
  partial: Omit<SymbolSpec, 'mockOnly'> & { mockOnly?: true },
): SymbolSpec {
  return tagMockOnly({
    symbol: partial.symbol,
    displayName: partial.displayName,
    marketType: partial.marketType,
    tickSize: partial.tickSize,
    lotSize: partial.lotSize,
    priceDecimals: partial.priceDecimals,
    qtyDecimals: partial.qtyDecimals,
    contractMultiplier: partial.contractMultiplier,
    currency: partial.currency,
    hedgeEnabled: partial.hedgeEnabled,
    mitEnabled: partial.mitEnabled,
    stopEnabled: partial.stopEnabled,
    shortEnabled: partial.shortEnabled,
    leverageEnabled: partial.leverageEnabled,
  })
}
