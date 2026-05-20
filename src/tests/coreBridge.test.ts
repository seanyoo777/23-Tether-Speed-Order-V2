import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearCoinMitQueuesForTests,
  listCoinMitQueue,
  registerCoinMitOnBook,
} from '../integration/coinMitBridge.ts'
import { getCoinBridgeMeta, resolveCoinSymbolConfig } from '../integration/coreBridge.ts'
import { getBridgeMeta } from '../integration/symbolConfigBridge.ts'
import { getSymbolConfig } from '../types/productTypes.ts'
import { createTradingSession } from '../engine/tradingSession.ts'

describe('core bridge / coin phase 1', () => {
  beforeEach(() => {
    clearCoinMitQueuesForTests()
  })

  it('resolveCoinSymbolConfig uses core tick for BTC', () => {
    const cfg = resolveCoinSymbolConfig('BTCUSDT')
    expect(cfg?.tick).toBe(0.5)
    expect(cfg?.basePrice).toBe(97_420)
  })

  it('getSymbolConfig delegates to bridge', () => {
    expect(getSymbolConfig('ETHUSDT')?.tick).toBe(0.05)
    expect(getSymbolConfig('SOLUSDT')?.tick).toBe(0.01)
  })

  it('getCoinBridgeMeta for SOL', () => {
    const meta = getCoinBridgeMeta('SOLUSDT')
    expect(meta?.mitEnabled).toBe(true)
    expect(getBridgeMeta('COIN_FUTURES', 'SOLUSDT')?.tickSize).toBe(0.01)
  })

  it('registerCoinMitOnBook locks click price', () => {
    const r = registerCoinMitOnBook({
      product: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      clickPrice: 97_555.5,
      intent: 'MIT_OPEN_LONG',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.lockedPrice).toBe(97_555.5)
      expect(listCoinMitQueue('BTCUSDT')).toHaveLength(1)
    }
  })

  it('tradingSession registerMit mirrors core queue for coin', () => {
    const session = createTradingSession()
    session.registerMit(97_500, 'LONG', 'MIT')
    expect(listCoinMitQueue('BTCUSDT').length).toBeGreaterThanOrEqual(1)
    expect(listCoinMitQueue('BTCUSDT')[0]?.triggerPrice).toBe(97_500)
  })

  it('placeLadderOrder writes core intent audit without changing fill', () => {
    const session = createTradingSession()
    const r = session.placeLadderOrder('order-right', 97_420)
    expect(r.ok).toBe(true)
    const audits = session._engines.audit.list()
    const row = audits.find((a) => a.action === 'core.intent.ladder')
    expect(row?.detail).toContain('OPEN_LONG')
    expect(row?.detail).toContain('97420')
  })
})
