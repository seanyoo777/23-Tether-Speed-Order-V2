import { describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'
import type { PositionSide } from '../types/tradingTypes.ts'
import { COIN_SYMBOL_CONFIG } from '../types/productTypes.ts'

const PRICE = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice

function netQty(
  positions: readonly { side: PositionSide; qty: number }[],
  side: PositionSide,
): number {
  return positions
    .filter((p) => p.side === side && p.qty > 1e-12)
    .reduce((sum, p) => sum + p.qty, 0)
}

describe('coin one-way primary (hedge OFF)', () => {
  it('new session defaults to one-way', () => {
    const s = createTradingSession()
    expect(s.getState().hedgeMode).toBe(false)
    expect(s.getState().productType).toBe('COIN_FUTURES')
  })

  it('flip long to short: buy 100 then sell 130', () => {
    const s = createTradingSession()
    s.setSharedOrderQty(100)
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', PRICE)
    s.setSharedOrderQty(130)
    s.setLadderDirection('sell')
    s.placeLadderOrder('order-left', PRICE)
    expect(netQty(s.getPositions(), 'LONG')).toBe(0)
    expect(netQty(s.getPositions(), 'SHORT')).toBe(30)
  })

  it('MIT triggers into one-way position', () => {
    const s = createTradingSession()
    expect(s.getState().hedgeMode).toBe(false)
    s.registerMit(PRICE + 10, 'LONG', 'MIT')
    s.manualTick('BTCUSDT', PRICE + 10)
    expect(netQty(s.getPositions(), 'LONG')).toBeGreaterThan(0)
    expect(netQty(s.getPositions(), 'SHORT')).toBe(0)
  })

  it('STOP triggers without hedge mode', () => {
    const s = createTradingSession()
    s.registerMit(PRICE - 10, 'SHORT', 'STOP')
    s.manualTick('BTCUSDT', PRICE - 10)
    expect(netQty(s.getPositions(), 'SHORT')).toBeGreaterThan(0)
  })

  it('TP/SL OCO on one-way ladder position', () => {
    const s = createTradingSession()
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', PRICE)
    const pos = s.getPositions()[0]!
    s.registerProtectionAtBook(pos.positionId, PRICE + 50)
    s.registerProtectionAtBook(pos.positionId, PRICE - 50)
    expect(
      s.getPendingOrders().filter((o) => o.positionId === pos.positionId).length,
    ).toBe(2)
    s.manualTick('BTCUSDT', PRICE + 50)
    expect(
      s.getPendingOrders().filter(
        (o) => o.positionId === pos.positionId && o.status === 'pending',
      ).length,
    ).toBe(0)
  })

  it('switching to overseas futures forces one-way', () => {
    const s = createTradingSession()
    s.setHedgeMode(true)
    s.setProduct('OVERSEAS_FUTURES')
    expect(s.getState().hedgeMode).toBe(false)
    expect(s.hedgeOpenLeg('LONG').ok).toBe(false)
  })
})
