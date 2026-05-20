import { beforeEach, describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'
import { COIN_SYMBOL_CONFIG, DEFAULT_SHARED_ORDER_QTY } from '../types/productTypes.ts'
import {
  clearOrderFlowPrefs,
  loadOrderFlowPrefs,
  saveOrderFlowPrefs,
} from '../orderFlow/flowPrefs.ts'
import { roundMitTriggerPrice } from '../integration/ladderMitBridge.ts'

const PRICE = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice
const TICK = COIN_SYMBOL_CONFIG.BTCUSDT.tick

function net(
  s: ReturnType<typeof createTradingSession>,
  side: 'LONG' | 'SHORT',
): number {
  return s
    .getPositions()
    .filter((p) => p.side === side && p.qty > 1e-12)
    .reduce((sum, p) => sum + p.qty, 0)
}

describe('P2 / one-way edge cases', () => {
  it('sell exact long qty => flat', () => {
    const s = createTradingSession()
    s.setSharedOrderQty(15)
    s.placePanelOrder('buy')
    s.setSharedOrderQty(15)
    s.placePanelOrder('sell')
    expect(net(s, 'LONG')).toBe(0)
    expect(net(s, 'SHORT')).toBe(0)
  })

  it('ladder left column opens short without prior sell mode', () => {
    const s = createTradingSession()
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-left', PRICE - 20)
    expect(net(s, 'SHORT')).toBe(DEFAULT_SHARED_ORDER_QTY)
    expect(s.getState().ladderDirection).toBe('sell')
  })

  it('limit panel adds to existing long leg', () => {
    const s = createTradingSession()
    s.setOrderEntryKind('limit')
    s.setLimitEntryPrice(PRICE)
    s.placePanelOrder('buy')
    s.setSharedOrderQty(0.02)
    s.setLimitEntryPrice(PRICE + TICK)
    s.placePanelOrder('buy')
    const leg = s.getPositions().find((p) => p.side === 'LONG')!
    expect(leg.qty).toBeCloseTo(DEFAULT_SHARED_ORDER_QTY + 0.02, 6)
  })
})

describe('P2 / hedge exchange edge cases', () => {
  function hedge() {
    const s = createTradingSession()
    s.setHedgeMode(true)
    return s
  }

  it('buy 5 closes short 5 of 10 (short 5 remains)', () => {
    const s = hedge()
    s.setSharedOrderQty(10)
    s.placePanelOrder('sell')
    s.setSharedOrderQty(5)
    s.placePanelOrder('buy')
    expect(net(s, 'SHORT')).toBe(5)
    expect(net(s, 'LONG')).toBe(0)
  })

  it('buy 15 closes short 10 and opens long 5', () => {
    const s = hedge()
    s.setSharedOrderQty(10)
    s.placePanelOrder('sell')
    s.setSharedOrderQty(15)
    s.placePanelOrder('buy')
    expect(net(s, 'SHORT')).toBe(0)
    expect(net(s, 'LONG')).toBe(5)
  })

  it('hedge limit panel sell at custom price', () => {
    const s = hedge()
    s.setOrderEntryKind('limit')
    s.setLimitEntryPrice(PRICE - 30)
    s.placePanelOrder('sell')
    const sh = s.getPositions().find((p) => p.side === 'SHORT')!
    expect(sh.avgPrice).toBe(PRICE - 30)
  })
})

describe('P2 / MIT STOP book rules', () => {
  it('STOP triggers on manualTick', () => {
    const s = createTradingSession()
    const trigger = PRICE - 50
    s.registerMit(trigger, 'SHORT', 'STOP')
    s.manualTick('BTCUSDT', trigger)
    expect(net(s, 'SHORT')).toBeGreaterThan(0)
    expect(s.getPendingMitStop().length).toBe(0)
  })

  it('MIT drag then trigger', () => {
    const s = createTradingSession()
    const id = s.registerMit(PRICE + 80, 'LONG', 'MIT')
    expect(s.updateOrderTrigger(id, PRICE + 40)).toBe(true)
    s.manualTick('BTCUSDT', PRICE + 40)
    expect(net(s, 'LONG')).toBeGreaterThan(0)
  })

  it('book-rounded MIT trigger price', () => {
    const s = createTradingSession()
    const raw = PRICE + TICK * 1.3
    const rounded = roundMitTriggerPrice('COIN_FUTURES', 'BTCUSDT', raw)
    s.registerMit(rounded, 'LONG', 'MIT')
    const o = s.getPendingMitStop()[0]!
    expect(o.triggerPrice).toBe(rounded)
  })
})

describe('P2 / order flow prefs', () => {
  beforeEach(() => clearOrderFlowPrefs())

  it('default OFF — ladder uses immediate one-way fill', () => {
    expect(loadOrderFlowPrefs().enabled).toBe(false)
    const s = createTradingSession()
    s.placeLadderOrder('order-right', PRICE)
    expect(net(s, 'LONG')).toBe(DEFAULT_SHARED_ORDER_QTY)
  })

  it('enabled one-way still fills via fillLadderLimit not hedge legs', () => {
    saveOrderFlowPrefs({ enabled: true, latencyMode: 'instant' })
    const s = createTradingSession({ bindSymbol: 'BTCUSDT' })
    s.placeLadderOrder('order-right', PRICE)
    expect(net(s, 'LONG')).toBe(DEFAULT_SHARED_ORDER_QTY)
    expect(s.getState().hedgeMode).toBe(false)
  })
})
