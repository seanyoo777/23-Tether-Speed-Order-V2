import {
  isProductEngineReady,
  productComingSoonMessage,
} from '../types/productTypes.ts'

export function createKoreaStockAdapter() {
  return {
    product: 'KOREA_STOCK' as const,
    canTrade: () => isProductEngineReady('KOREA_STOCK'),
    blockMessage: () => productComingSoonMessage('KOREA_STOCK'),
  }
}