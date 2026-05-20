import { validateSymbolSpec } from './schema.ts'
import { SYMBOL_SPEC_REGISTRY } from './registry.ts'
import type { SymbolSpec } from './types.ts'

export function getSymbolSpec(symbol: string): SymbolSpec | undefined {
  return SYMBOL_SPEC_REGISTRY[symbol]
}

export function requireSymbolSpec(symbol: string): SymbolSpec {
  const spec = getSymbolSpec(symbol)
  if (!spec) throw new Error(`SymbolSpec not found: ${symbol}`)
  const errors = validateSymbolSpec(spec)
  if (errors.length > 0) {
    throw new Error(`Invalid SymbolSpec ${symbol}: ${errors.join(', ')}`)
  }
  return spec
}

export function roundPrice(spec: SymbolSpec, price: number): number {
  const steps = Math.round(price / spec.tickSize)
  const raw = steps * spec.tickSize
  const factor = 10 ** spec.priceDecimals
  return Math.round(raw * factor) / factor
}

export function roundQty(spec: SymbolSpec, qty: number): number {
  const steps = Math.round(qty / spec.lotSize)
  const raw = steps * spec.lotSize
  const factor = 10 ** spec.qtyDecimals
  return Math.round(raw * factor) / factor
}

export function listSymbolSpecs(): SymbolSpec[] {
  return Object.values(SYMBOL_SPEC_REGISTRY)
}
