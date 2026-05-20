import { describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'

function netQty(
  s: ReturnType<typeof createTradingSession>,
  side: 'LONG' | 'SHORT',
) {
  return s
    .getPositions()
    .filter((p) => p.side === side && p.qty > 1e-12)
    .reduce((sum, p) => sum + p.qty, 0)
}

describe('hedge exchange fill', () => {
  function hedgeSession() {
    const s = createTradingSession()
    s.setHedgeMode(true)
    return s
  }

  it('buy closes short before opening long', () => {
    const s = hedgeSession()
    s.setSharedOrderQty(10)
    s.placeHedgeExchangeOrder('sell', 97_420)
    expect(netQty(s, 'SHORT')).toBe(10)
    s.placeHedgeExchangeOrder('buy', 97_420)
    expect(netQty(s, 'SHORT')).toBe(0)
    expect(netQty(s, 'LONG')).toBe(0)
  })

  it('sell opens short without closing long (청산은 호가 버튼)', () => {
    const s = hedgeSession()
    s.setSharedOrderQty(20)
    s.placeHedgeExchangeOrder('buy', 97_420)
    expect(netQty(s, 'LONG')).toBe(20)
    s.setSharedOrderQty(10)
    s.placeHedgeExchangeOrder('sell', 97_420)
    expect(netQty(s, 'LONG')).toBe(20)
    expect(netQty(s, 'SHORT')).toBe(10)
    expect(s.closeHedgeLegOnBook('LONG', 97_430).ok).toBe(true)
    expect(netQty(s, 'LONG')).toBe(0)
  })

  it('can hold long and short in hedge mode', () => {
    const s = hedgeSession()
    s.setSharedOrderQty(5)
    s.placeHedgeExchangeOrder('buy', 97_420)
    s.placeHedgeExchangeOrder('sell', 97_420)
    expect(netQty(s, 'LONG')).toBe(5)
    expect(netQty(s, 'SHORT')).toBe(5)
  })

  it('ladder buy column matches exchange buy', () => {
    const s = hedgeSession()
    s.setSharedOrderQty(8)
    s.placeLadderOrder('order-left', 97_420)
    expect(netQty(s, 'SHORT')).toBe(8)
    s.placeLadderOrder('order-right', 97_420)
    expect(netQty(s, 'SHORT')).toBe(0)
  })

  it('close on book closes leg', () => {
    const s = hedgeSession()
    s.setSharedOrderQty(3)
    s.placeHedgeExchangeOrder('buy', 97_420)
    expect(s.closeHedgeLegOnBook('LONG', 97_430).ok).toBe(true)
    expect(netQty(s, 'LONG')).toBe(0)
  })
})
