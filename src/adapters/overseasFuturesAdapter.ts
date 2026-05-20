import { productComingSoonMessage } from '../types/productTypes.ts'

export function createOverseasFuturesAdapter() {
  return {
    product: 'OVERSEAS_FUTURES' as const,
    canTrade: () => false,
    blockMessage: () => productComingSoonMessage('OVERSEAS_FUTURES'),
  }
}
