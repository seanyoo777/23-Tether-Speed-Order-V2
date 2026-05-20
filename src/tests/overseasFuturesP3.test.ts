import { describe, expect, it } from 'vitest'
import { unrealizedPnl } from '../engine/pnlEngine.ts'
import { getProductAdapter } from '../core/productAdapter/factory.ts'
import { getCoreSpec } from '../integration/symbolConfigBridge.ts'
import { createTradingSession } from '../engine/tradingSession.ts'
import {
  defaultSymbolForProduct,
  isProductEngineReady,
  supportsHedgeMode,
} from '../types/productTypes.ts'
import { COIN_SYMBOL_CONFIG } from '../types/productTypes.ts'

const ES = 5_800

function net(
  s: ReturnType<typeof createTradingSession>,
  side: 'LONG' | 'SHORT',
): number {
  return s
    .getPositions()
    .filter((p) => p.side === side && p.qty > 1e-12)
    .reduce((sum, p) => sum + p.qty, 0)
}

describe('P3 / overseas futures ESZ6', () => {
  it('engine-ready, no hedge toggle', () => {
    expect(isProductEngineReady('OVERSEAS_FUTURES')).toBe(true)
    expect(supportsHedgeMode('OVERSEAS_FUTURES')).toBe(false)
    expect(defaultSymbolForProduct('OVERSEAS_FUTURES')).toBe('ESZ6')
  })

  it('one-way panel market buy on ESZ6', () => {
    const s = createTradingSession()
    s.setProduct('OVERSEAS_FUTURES')
    s.setOrderEntryKind('market')
    s.setSharedOrderQty(2)
    const r = s.placePanelOrder('buy')
    expect(r.ok).toBe(true)
    expect(net(s, 'LONG')).toBe(2)
    expect(s.getState().hedgeMode).toBe(false)
  })

  it('ladder sell column opens short (one-way)', () => {
    const s = createTradingSession()
    s.setProduct('OVERSEAS_FUTURES')
    s.placeLadderOrder('order-left', ES)
    expect(net(s, 'SHORT')).toBeGreaterThan(0)
  })

  it('hedge APIs rejected on overseas', () => {
    const s = createTradingSession()
    s.setProduct('OVERSEAS_FUTURES')
    s.setHedgeMode(true)
    expect(s.getState().hedgeMode).toBe(false)
    expect(s.hedgeOpenLeg('LONG').ok).toBe(false)
  })

  it('switching from coin clears hedge mode', () => {
    const s = createTradingSession()
    s.setHedgeMode(true)
    s.setProduct('OVERSEAS_FUTURES')
    expect(s.getState().hedgeMode).toBe(false)
  })
})

describe('P3 / overseas PnL adapter', () => {
  it('ESZ6 uses contract multiplier via adapter', () => {
    const spec = getCoreSpec('OVERSEAS_FUTURES', 'ESZ6')!
    const pnl = getProductAdapter(spec.marketType).unrealizedPnl(spec, {
      side: 'LONG',
      qty: 1,
      avgPrice: ES,
      markPrice: ES + 1,
    })
    expect(pnl).toBeGreaterThan(1)
    const linear = (ES + 1 - ES) * 1
    expect(pnl).toBeGreaterThan(linear)
  })

  it('pnlEngine routes OVERSEAS_FUTURES positions to adapter', () => {
    const pnl = unrealizedPnl(
      {
        productType: 'OVERSEAS_FUTURES',
        symbol: 'ESZ6',
        side: 'LONG',
        qty: 1,
        avgPrice: ES,
      },
      ES + 1,
    )
    expect(pnl).toBeGreaterThan(1)
  })

  it('coin PnL unchanged', () => {
    const pnl = unrealizedPnl(
      {
        productType: 'COIN_FUTURES',
        symbol: 'BTCUSDT',
        side: 'LONG',
        qty: 0.05,
        avgPrice: COIN_SYMBOL_CONFIG.BTCUSDT.basePrice,
      },
      COIN_SYMBOL_CONFIG.BTCUSDT.basePrice + 10,
    )
    expect(pnl).toBeCloseTo(0.5, 4)
  })
})
