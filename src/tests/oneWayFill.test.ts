import { describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'
import type { PositionSide } from '../types/tradingTypes.ts'
import {
  supportsHedgeMode,
  useHedgeLegTrading,
} from '../types/productTypes.ts'

function netQty(
  positions: readonly { side: PositionSide; qty: number }[],
  side: PositionSide,
): number {
  return positions
    .filter((p) => p.side === side && p.qty > 1e-12)
    .reduce((sum, p) => sum + p.qty, 0)
}

describe('position mode policy', () => {
  it('only coin supports hedge toggle', () => {
    expect(supportsHedgeMode('COIN_FUTURES')).toBe(true)
    expect(supportsHedgeMode('OVERSEAS_FUTURES')).toBe(false)
    expect(useHedgeLegTrading('COIN_FUTURES', false)).toBe(false)
    expect(useHedgeLegTrading('COIN_FUTURES', true)).toBe(true)
  })
})

describe('coin default one-way', () => {
  it('long 20 then sell 10 => net long 10', () => {
    const s = createTradingSession()
    expect(s.getState().hedgeMode).toBe(false)
    s.setSharedOrderQty(20)
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', 97_420)
    s.setSharedOrderQty(10)
    s.setLadderDirection('sell')
    s.placeLadderOrder('order-left', 97_420)
    expect(netQty(s.getPositions(), 'LONG')).toBe(10)
    expect(netQty(s.getPositions(), 'SHORT')).toBe(0)
  })

  it('hedge mode uses exchange fill not one-way net', () => {
    const s = createTradingSession()
    s.setHedgeMode(true)
    s.setSharedOrderQty(10)
    s.placeHedgeExchangeOrder('buy', 97_420)
    s.placeHedgeExchangeOrder('sell', 97_420)
    expect(netQty(s.getPositions(), 'LONG')).toBe(10)
    expect(netQty(s.getPositions(), 'SHORT')).toBe(10)
  })
})

describe('one-way overseas futures', () => {
  it('long 20 then sell 10 => net long 10', () => {
    const s = createTradingSession()
    s.setProduct('OVERSEAS_FUTURES')
    s.setSharedOrderQty(20)
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', 5_800)
    s.setSharedOrderQty(10)
    s.setLadderDirection('sell')
    s.placeLadderOrder('order-left', 5_800)
    expect(netQty(s.getPositions(), 'LONG')).toBe(10)
    expect(netQty(s.getPositions(), 'SHORT')).toBe(0)
  })

  it('stock rule: long 100 then sell 130 => net short 30', () => {
    const s = createTradingSession()
    s.setProduct('OVERSEAS_FUTURES')
    s.setSharedOrderQty(100)
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', 5_800)
    s.setSharedOrderQty(130)
    s.setLadderDirection('sell')
    s.placeLadderOrder('order-left', 5_800)
    expect(netQty(s.getPositions(), 'LONG')).toBe(0)
    expect(netQty(s.getPositions(), 'SHORT')).toBe(30)
  })

  it('rejects hedge API', () => {
    const s = createTradingSession()
    s.setProduct('OVERSEAS_FUTURES')
    expect(s.hedgeOpenLeg('LONG').ok).toBe(false)
  })
})
