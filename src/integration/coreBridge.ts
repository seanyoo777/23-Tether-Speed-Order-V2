/**
 * @deprecated Import from symbolConfigBridge — coin aliases kept for tests.
 */
import type { OrderIntent } from '../core/orderIntent/index.ts'
import { describeIntent } from '../core/orderIntent/index.ts'
import type { ProductType } from '../types/productTypes.ts'
import { COIN_SYMBOLS } from '../types/productTypes.ts'
import {
  getBridgeMeta,
  isProductBridgeReady,
  resolveProductSymbolConfig,
  type BridgeMeta,
} from './symbolConfigBridge.ts'

export type { BridgeMeta as CoinBridgeMeta }

export function productTypeToCoreMarket(product: ProductType) {
  if (product === 'COIN_FUTURES') return 'coin' as const
  return null
}

export function isCoinCoreBridgeReady(product: ProductType, symbol: string): boolean {
  return isProductBridgeReady(product, symbol)
}

export function resolveCoinSymbolConfig(symbol: string) {
  return resolveProductSymbolConfig('COIN_FUTURES', symbol)
}

export function getCoinBridgeMeta(symbol: string): BridgeMeta | null {
  return getBridgeMeta('COIN_FUTURES', symbol)
}

export function describeCoinLadderIntent(
  hedgeMode: boolean,
  column: 'order-left' | 'order-right',
  closeMode: boolean,
): OrderIntent {
  if (closeMode) {
    return column === 'order-right' ? 'CLOSE_LONG' : 'CLOSE_SHORT'
  }
  if (hedgeMode) {
    return column === 'order-right' ? 'OPEN_LONG' : 'OPEN_SHORT'
  }
  return column === 'order-right' ? 'OPEN_LONG' : 'OPEN_SHORT'
}

export function logCoinIntentPreview(intent: OrderIntent): string {
  const meta = describeIntent(intent)
  return `${meta.intent} · ${meta.hedgeSide} · reduceOnly=${meta.reduceOnly}`
}

export { COIN_SYMBOLS }
