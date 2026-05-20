import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearCoinMitQueuesForTests,
  listCoinMitQueue,
} from '../integration/coinMitBridge.ts'
import {
  isProductBridgeReady,
  resolveProductSymbolConfig,
} from '../integration/symbolConfigBridge.ts'
import { watchlistRowsForProduct } from '../integration/watchlistBridge.ts'
import { canRegisterBookMit, roundMitTriggerPrice } from '../integration/ladderMitBridge.ts'
import { createTradingSession } from '../engine/tradingSession.ts'
import {
  defaultSymbolForProduct,
  isProductEngineReady,
  symbolsForProduct,
} from '../types/productTypes.ts'

describe('overseas futures phase 2', () => {
  beforeEach(() => {
    clearCoinMitQueuesForTests()
  })

  it('OVERSEAS_FUTURES is engine-ready with ESZ6', () => {
    expect(isProductEngineReady('OVERSEAS_FUTURES')).toBe(true)
    expect(symbolsForProduct('OVERSEAS_FUTURES')).toEqual(['ESZ6'])
    expect(defaultSymbolForProduct('OVERSEAS_FUTURES')).toBe('ESZ6')
  })

  it('resolveProductSymbolConfig tick 0.25', () => {
    const cfg = resolveProductSymbolConfig('OVERSEAS_FUTURES', 'ESZ6')
    expect(cfg?.tick).toBe(0.25)
    expect(cfg?.basePrice).toBe(5_800)
  })

  it('watchlist lists ESZ6 from registry', () => {
    const rows = watchlistRowsForProduct('OVERSEAS_FUTURES')
    expect(rows.some((r) => r.symbol === 'ESZ6' && r.tradable)).toBe(true)
  })

  it('setProduct switches to ESZ6', () => {
    const session = createTradingSession()
    session.setProduct('OVERSEAS_FUTURES')
    expect(session.getState().symbol).toBe('ESZ6')
    expect(session.getLastPrice('ESZ6')).toBeGreaterThan(0)
  })

  it('MIT on ES book with tick round', () => {
    expect(isProductBridgeReady('OVERSEAS_FUTURES', 'ESZ6')).toBe(true)
    expect(canRegisterBookMit('OVERSEAS_FUTURES', 'ESZ6')).toBe(true)
    const session = createTradingSession()
    session.setProduct('OVERSEAS_FUTURES')
    const id = session.registerMit(5_801.13, 'LONG', 'MIT')
    expect(roundMitTriggerPrice('OVERSEAS_FUTURES', 'ESZ6', 5_801.13)).toBe(5_801.25)
    expect(listCoinMitQueue('ESZ6').length).toBeGreaterThanOrEqual(1)
    expect(session.cancelOrder(id)).toBe(true)
  })
})
