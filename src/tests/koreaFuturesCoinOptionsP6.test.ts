import { describe, expect, it } from 'vitest'
import { canRegisterBookMit } from '../integration/ladderMitBridge.ts'
import { getCoreSpec } from '../integration/symbolConfigBridge.ts'
import { unrealizedPnl } from '../engine/pnlEngine.ts'
import { createTradingSession } from '../engine/tradingSession.ts'
import {
  COIN_OPTIONS_SYMBOL_CONFIG,
  defaultSymbolForProduct,
  isProductEngineReady,
  KOREA_FUTURES_SYMBOL_CONFIG,
  PRODUCT_TAB_ORDER,
  supportsHedgeMode,
} from '../types/productTypes.ts'

const KF = KOREA_FUTURES_SYMBOL_CONFIG.KOSPI200F.basePrice
const OPT = COIN_OPTIONS_SYMBOL_CONFIG.BTC_97000_C.basePrice

function netQty(
  s: ReturnType<typeof createTradingSession>,
  side: 'LONG' | 'SHORT',
): number {
  return s
    .getPositions()
    .filter((p) => p.side === side && p.qty > 1e-12)
    .reduce((sum, p) => sum + p.qty, 0)
}

describe('P6 / baseline tools — 국내선물 + 옵션', () => {
  it('PRODUCT_TAB_ORDER has six engine-ready groups', () => {
    expect(PRODUCT_TAB_ORDER).toHaveLength(6)
    for (const p of PRODUCT_TAB_ORDER) {
      expect(isProductEngineReady(p)).toBe(true)
    }
  })

  it('KOREA_FUTURES KOSPI200F one-way panel + ladder', () => {
    expect(defaultSymbolForProduct('KOREA_FUTURES')).toBe('KOSPI200F')
    expect(supportsHedgeMode('KOREA_FUTURES')).toBe(false)
    expect(canRegisterBookMit('KOREA_FUTURES', 'KOSPI200F')).toBe(true)

    const s = createTradingSession()
    s.setProduct('KOREA_FUTURES')
    s.setOrderEntryKind('market')
    s.setSharedOrderQty(1)
    expect(s.placePanelOrder('buy').ok).toBe(true)
    expect(netQty(s, 'LONG')).toBe(1)

    const shortLeg = createTradingSession()
    shortLeg.setProduct('KOREA_FUTURES')
    shortLeg.placeLadderOrder('order-left', KF)
    expect(netQty(shortLeg, 'SHORT')).toBeGreaterThan(0)
  })

  it('COIN_OPTIONS BTC_97000_C one-way + book MIT', () => {
    expect(defaultSymbolForProduct('COIN_OPTIONS')).toBe('BTC_97000_C')
    expect(canRegisterBookMit('COIN_OPTIONS', 'BTC_97000_C')).toBe(true)

    const s = createTradingSession()
    s.setProduct('COIN_OPTIONS')
    s.setSharedOrderQty(0.05)
    expect(s.placePanelOrder('buy').ok).toBe(true)
    const id = s.registerMit(OPT + 10, 'LONG', 'MIT')
    expect(id).toBeTruthy()
    s.manualTick('BTC_97000_C', OPT + 10)
    expect(s.getLastTrigger()?.kind).toBe('MIT')
  })

  it('adapter PnL for kr_future and option', () => {
    const kf = getCoreSpec('KOREA_FUTURES', 'KOSPI200F')!
    expect(kf.contractMultiplier).toBeGreaterThan(1000)
    const kfPnl = unrealizedPnl(
      {
        productType: 'KOREA_FUTURES',
        symbol: 'KOSPI200F',
        side: 'LONG',
        qty: 1,
        avgPrice: KF,
      },
      KF + 0.05,
    )
    expect(kfPnl).toBeGreaterThan(1)

    const optPnl = unrealizedPnl(
      {
        productType: 'COIN_OPTIONS',
        symbol: 'BTC_97000_C',
        side: 'LONG',
        qty: 1,
        avgPrice: OPT,
      },
      OPT + 1,
    )
    expect(optPnl).toBeCloseTo(1, 4)
  })
})
