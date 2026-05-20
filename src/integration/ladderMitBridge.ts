/**
 * 호가창 STOP 열 MIT — 클릭한 줄 가격에 트리거 고정 (자동 추종 없음).
 */
import { roundPrice } from '../core/symbolSpec/engine.ts'
import { requireSymbolSpec } from '../core/symbolSpec/engine.ts'
import { isProductBridgeReady } from './symbolConfigBridge.ts'
import type { ProductType } from '../types/productTypes.ts'
import type { LadderDirection } from '../types/tradingTypes.ts'
import type { PositionSide } from '../types/tradingTypes.ts'

export function mitSideFromLadderMode(direction: LadderDirection): PositionSide {
  return direction === 'buy' ? 'LONG' : 'SHORT'
}

export function roundMitTriggerPrice(product: ProductType, symbol: string, raw: number): number {
  if (!isProductBridgeReady(product, symbol)) return raw
  const spec = requireSymbolSpec(symbol)
  return roundPrice(spec, raw)
}

export function canRegisterBookMit(product: ProductType, symbol: string): boolean {
  if (!isProductBridgeReady(product, symbol)) return false
  const spec = requireSymbolSpec(symbol)
  return spec.mitEnabled
}
