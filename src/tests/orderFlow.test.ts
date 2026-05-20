import { beforeEach, describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'
import { COIN_SYMBOL_CONFIG, DEFAULT_SHARED_ORDER_QTY } from '../types/productTypes.ts'
import { SessionRegistry } from '../workspace/sessionRegistry.ts'
import { clearSessionStorage } from '../workspace/sessionPersistence.ts'
import { planLadderFill } from '../orderFlow/flowEngine.ts'
import { clearOrderFlowPrefs, loadOrderFlowPrefs, saveOrderFlowPrefs } from '../orderFlow/flowPrefs.ts'

const BTC = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice

describe('PHASE_REALISTIC_ORDER_FLOW', () => {
  beforeEach(() => {
    clearOrderFlowPrefs()
    clearSessionStorage()
    saveOrderFlowPrefs({ enabled: true, latencyMode: 'instant' })
  })

  it('planLadderFill produces partial slices in volatile mode', () => {
    const plan = planLadderFill({
      symbol: 'BTCUSDT',
      column: 'order-right',
      limitPrice: BTC,
      totalQty: 0.15,
      lastPrice: BTC,
      latencyMode: 'volatile',
      flowSeed: 42,
    })
    expect(plan.slices.length).toBeGreaterThanOrEqual(2)
    const sum = plan.slices.reduce((a, s) => a + s.qty, 0)
    expect(sum).toBeCloseTo(0.15, 4)
    expect(plan.slices[0]!.liquidityRole).toBeDefined()
  })

  it('instant flow fill on one-way uses fillLadderLimit', () => {
    const s = createTradingSession({ bindSymbol: 'BTCUSDT' })
    s.setSymbol('BTCUSDT')
    s.setSharedOrderQty(DEFAULT_SHARED_ORDER_QTY)
    const r = s.placeLadderOrder('order-right', BTC)
    expect(r.ok).toBe(true)
    expect(s.getPositions().some((p) => p.symbol === 'BTCUSDT')).toBe(true)
    expect(s.getState().ladderDirection).toBe('buy')
  })

  it('hedge mode ladder uses exchange fill (flow prefs do not block)', () => {
    const s = createTradingSession({ bindSymbol: 'BTCUSDT' })
    s.setHedgeMode(true)
    s.setSharedOrderQty(DEFAULT_SHARED_ORDER_QTY)
    const r = s.placeLadderOrder('order-right', BTC)
    expect(r.ok).toBe(true)
    expect(s.getPositions().some((p) => p.side === 'LONG')).toBe(true)
  })

  it('sessions isolated — ETH fill does not affect BTC tab', () => {
    const reg = new SessionRegistry()
    const btc = reg.getOrCreate('tab-btc', 'BTCUSDT')
    const eth = reg.getOrCreate('tab-eth', 'ETHUSDT')
    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', BTC)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', COIN_SYMBOL_CONFIG.ETHUSDT.basePrice)
    expect(btc.getPositions().every((p) => p.symbol === 'BTCUSDT')).toBe(true)
    expect(eth.getPositions().every((p) => p.symbol === 'ETHUSDT')).toBe(true)
  })

  it('cancel race on partial pending', () => {
    const s = createTradingSession({ bindSymbol: 'BTCUSDT' })
    s.setSymbol('BTCUSDT')
    s.setOrderFlowPrefs({ enabled: true, latencyMode: 'instant' })
    const raceOrd = s._engines.orders.add({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      side: 'LONG',
      kind: 'LIMIT',
      triggerPrice: BTC,
      qty: 0.1,
      filledQty: 0.05,
      status: 'pending',
    })
    expect(s.cancelOrder(raceOrd.id)).toBe(false)
    expect(s.getOrderFlowVisual().tag).toBe('cancel_race')
  })

  it('flow prefs persist', () => {
    saveOrderFlowPrefs({ enabled: true, latencyMode: 'volatile' })
    expect(loadOrderFlowPrefs().latencyMode).toBe('volatile')
  })
})
