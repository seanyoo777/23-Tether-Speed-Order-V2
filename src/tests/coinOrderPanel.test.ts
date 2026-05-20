import { describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'
import { COIN_SYMBOL_CONFIG, DEFAULT_SHARED_ORDER_QTY } from '../types/productTypes.ts'

const PRICE = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice

function netQty(
  positions: readonly { side: 'LONG' | 'SHORT'; qty: number }[],
  side: 'LONG' | 'SHORT',
): number {
  return positions
    .filter((p) => p.side === side && p.qty > 1e-12)
    .reduce((sum, p) => sum + p.qty, 0)
}

describe('coin order panel — market / limit', () => {
  it('market buy opens LONG at last', () => {
    const s = createTradingSession()
    s.setOrderEntryKind('market')
    const r = s.placePanelOrder('buy')
    expect(r.ok).toBe(true)
    expect(netQty(s.getPositions(), 'LONG')).toBe(DEFAULT_SHARED_ORDER_QTY)
  })

  it('market sell opens SHORT at last', () => {
    const s = createTradingSession()
    s.setOrderEntryKind('market')
    const r = s.placePanelOrder('sell')
    expect(r.ok).toBe(true)
    expect(netQty(s.getPositions(), 'SHORT')).toBe(DEFAULT_SHARED_ORDER_QTY)
  })

  it('limit buy at custom price', () => {
    const s = createTradingSession()
    s.setOrderEntryKind('limit')
    s.setLimitEntryPrice(PRICE - 50)
    const r = s.placePanelOrder('buy')
    expect(r.ok).toBe(true)
    const leg = s.getPositions().find((p) => p.side === 'LONG')
    expect(leg?.avgPrice).toBe(PRICE - 50)
  })

  it('ladder click sets limit price and direction', () => {
    const s = createTradingSession()
    s.setOrderEntryKind('market')
    s.placeLadderOrder('order-left', PRICE - 10)
    expect(s.getState().ladderDirection).toBe('sell')
    expect(s.getState().limitEntryPrice).toBe(PRICE - 10)
    expect(s.getState().orderEntryKind).toBe('limit')
  })

  it('hedge panel limit uses fill price', () => {
    const s = createTradingSession()
    s.setHedgeMode(true)
    s.setOrderEntryKind('limit')
    s.setLimitEntryPrice(PRICE + 20)
    const r = s.placePanelOrder('buy')
    expect(r.ok).toBe(true)
    expect(netQty(s.getPositions(), 'LONG')).toBe(DEFAULT_SHARED_ORDER_QTY)
  })
})
