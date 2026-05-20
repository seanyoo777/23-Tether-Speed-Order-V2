import type { ProductType } from '../types/productTypes.ts'
import { isProductEngineReady } from '../types/productTypes.ts'
import type { TradingSession } from '../engine/tradingSession.ts'

export type AdapterResult = { ok: true } | { ok: false; message: string }

export function createCoinFuturesAdapter(session: TradingSession) {
  return {
    product: 'COIN_FUTURES' as ProductType,

    canTrade(): boolean {
      return isProductEngineReady('COIN_FUTURES')
    },

    placeLadder(...args: Parameters<TradingSession['placeLadderOrder']>) {
      return session.placeLadderOrder(...args)
    },

    close(...args: Parameters<TradingSession['closePosition']>) {
      return session.closePosition(...args)
    },
  }
}
