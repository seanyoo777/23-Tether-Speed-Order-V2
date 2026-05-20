import {
  isProductEngineReady,
  productComingSoonMessage,
} from '../types/productTypes.ts'

export function createUsStockAdapter() {
  return {
    product: 'US_STOCK' as const,
    canTrade: () => isProductEngineReady('US_STOCK'),
    blockMessage: () => productComingSoonMessage('US_STOCK'),
  }
}