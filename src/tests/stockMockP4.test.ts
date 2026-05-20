import { describe, expect, it } from 'vitest'
import { unrealizedPnl } from '../engine/pnlEngine.ts'
import {
  getCoreSpec,
  isProductBridgeReady,
  roundBridgePrice,
} from '../integration/symbolConfigBridge.ts'
import { watchlistRowsForProduct } from '../integration/watchlistBridge.ts'
import { createTradingSession } from '../engine/tradingSession.ts'
import {
  defaultSymbolForProduct,
  getSymbolConfig,
  isProductEngineReady,
  KOREA_STOCK_SYMBOL_CONFIG,
  supportsHedgeMode,
  US_STOCK_SYMBOL_CONFIG,
} from '../types/productTypes.ts'
import { canRegisterBookMit } from '../integration/ladderMitBridge.ts'

const AAPL = US_STOCK_SYMBOL_CONFIG.AAPL.basePrice
const SAM = KOREA_STOCK_SYMBOL_CONFIG['005930'].basePrice

function netQty(
  s: ReturnType<typeof createTradingSession>,
  side: 'LONG' | 'SHORT',
): number {
  return s
    .getPositions()
    .filter((p) => p.side === side && p.qty > 1e-12)
    .reduce((sum, p) => sum + p.qty, 0)
}

describe('P4 / US stock AAPL', () => {
  it('engine-ready, bridge, watchlist tradable', () => {
    expect(isProductEngineReady('US_STOCK')).toBe(true)
    expect(defaultSymbolForProduct('US_STOCK')).toBe('AAPL')
    expect(isProductBridgeReady('US_STOCK', 'AAPL')).toBe(true)
    expect(supportsHedgeMode('US_STOCK')).toBe(false)
    const rows = watchlistRowsForProduct('US_STOCK')
    expect(rows.some((r) => r.symbol === 'AAPL' && r.tradable)).toBe(true)
    expect(getSymbolConfig('AAPL')?.tick).toBe(0.01)
  })

  it('one-way panel market buy', () => {
    const s = createTradingSession()
    s.setProduct('US_STOCK')
    s.setOrderEntryKind('market')
    s.setSharedOrderQty(10)
    const r = s.placePanelOrder('buy')
    expect(r.ok).toBe(true)
    expect(netQty(s, 'LONG')).toBe(10)
    expect(s.getState().hedgeMode).toBe(false)
  })

  it('ladder sell column opens short', () => {
    const s = createTradingSession()
    s.setProduct('US_STOCK')
    s.placeLadderOrder('order-left', AAPL)
    expect(netQty(s, 'SHORT')).toBeGreaterThan(0)
  })

  it('hedge APIs rejected', () => {
    const s = createTradingSession()
    s.setProduct('US_STOCK')
    s.setHedgeMode(true)
    expect(s.getState().hedgeMode).toBe(false)
    expect(s.hedgeOpenLeg('LONG').ok).toBe(false)
  })

  it('book MIT disabled (STOP panel path unchanged)', () => {
    expect(canRegisterBookMit('US_STOCK', 'AAPL')).toBe(false)
  })
})

describe('P4 / Korea stock 005930', () => {
  it('engine-ready, KRX tick rounding', () => {
    expect(isProductEngineReady('KOREA_STOCK')).toBe(true)
    expect(defaultSymbolForProduct('KOREA_STOCK')).toBe('005930')
    expect(isProductBridgeReady('KOREA_STOCK', '005930')).toBe(true)
    expect(roundBridgePrice('KOREA_STOCK', '005930', 58_123)).toBe(58_100)
    expect(getSymbolConfig('005930')?.tick).toBe(100)
  })

  it('one-way flip: buy 100 then sell 130 => short 30', () => {
    const s = createTradingSession()
    s.setProduct('KOREA_STOCK')
    s.setSharedOrderQty(100)
    expect(s.placePanelOrder('buy').ok).toBe(true)
    s.setSharedOrderQty(130)
    expect(s.placePanelOrder('sell').ok).toBe(true)
    expect(netQty(s, 'LONG')).toBe(0)
    expect(netQty(s, 'SHORT')).toBeCloseTo(30, 6)
  })

  it('switch US → KR resets symbol', () => {
    const s = createTradingSession()
    s.setProduct('US_STOCK')
    expect(s.getState().symbol).toBe('AAPL')
    s.setProduct('KOREA_STOCK')
    expect(s.getState().symbol).toBe('005930')
    s.manualTick('005930', SAM)
    expect(s.placePanelOrder('buy').ok).toBe(true)
  })
})

describe('P4 / stock PnL adapter', () => {
  it('US_STOCK uses linear adapter via pnlEngine', () => {
    const spec = getCoreSpec('US_STOCK', 'AAPL')!
    expect(spec.contractMultiplier).toBe(1)
    const pnl = unrealizedPnl(
      {
        productType: 'US_STOCK',
        symbol: 'AAPL',
        side: 'LONG',
        qty: 10,
        avgPrice: AAPL,
      },
      AAPL + 1,
    )
    expect(pnl).toBeCloseTo(10, 4)
  })

  it('KOREA_STOCK pnl linear (multiplier 1)', () => {
    const pnl = unrealizedPnl(
      {
        productType: 'KOREA_STOCK',
        symbol: '005930',
        side: 'LONG',
        qty: 50,
        avgPrice: SAM,
      },
      SAM + 100,
    )
    expect(pnl).toBeCloseTo(5_000, 0)
  })
})
