import { describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'
import { resolveQueuedStatus } from '../mitAdvanced/queuedStatus.ts'
import { mockLiquidationPrice, riskLineForPositions } from '../mitAdvanced/riskLine.ts'
import { createOrderStore } from '../engine/orderStore.ts'
import { COIN_SYMBOL_CONFIG } from '../types/productTypes.ts'

const PRICE = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice
const tick = COIN_SYMBOL_CONFIG.BTCUSDT.tick

describe('mitAdvanced / queued status', () => {
  it('MIT LONG WAITING when price below trigger', () => {
    const orders = createOrderStore()
    const o = orders.add({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      side: 'LONG',
      kind: 'MIT',
      triggerPrice: PRICE + 100,
      qty: 0.05,
    })
    expect(resolveQueuedStatus(o, PRICE, PRICE, tick)).toBe('WAITING')
  })

  it('MIT LONG ARMED when breakout trigger reached', () => {
    const orders = createOrderStore()
    const trigger = PRICE + 100
    const o = orders.add({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      side: 'LONG',
      kind: 'MIT',
      triggerPrice: trigger,
      qty: 0.05,
    })
    expect(resolveQueuedStatus(o, trigger + 50, PRICE, tick)).toBe('ARMED')
  })
})

describe('mitAdvanced / session', () => {
  it('LONG MIT registers and can move trigger', () => {
    const s = createTradingSession()
    const id = s.registerMit(PRICE + 200, 'LONG', 'MIT')
    expect(s.updateOrderTrigger(id, PRICE + 150)).toBe(true)
    expect(s.getPendingMitStop().find((o) => o.id === id)?.triggerPrice).toBe(
      PRICE + 150,
    )
  })

  it('SHORT MIT registers', () => {
    const s = createTradingSession()
    s.setLadderDirection('sell')
    const id = s.registerMit(PRICE - 200, 'SHORT', 'MIT')
    expect(s.getPendingMitStop().some((o) => o.id === id && o.side === 'SHORT')).toBe(
      true,
    )
  })

  it('marker cancel removes pending MIT', () => {
    const s = createTradingSession()
    const id = s.registerMit(PRICE + 100, 'LONG', 'MIT')
    expect(s.cancelOrder(id)).toBe(true)
    expect(s.getPendingMitStop().find((o) => o.id === id)).toBeUndefined()
  })

  it('partial TP leaves position qty', () => {
    const s = createTradingSession()
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', PRICE)
    const pos = s.getPositions()[0]!
    s.setSelectedPositionId(pos.positionId)
    s.registerAutoProtection(50, 50, 50)
    const tp = s
      .getPendingOrders()
      .find((o) => o.kind === 'PROTECTION_TP' && o.positionId === pos.positionId)
    expect(tp?.qty).toBeCloseTo(pos.qty * 0.5, 6)
  })

  it('close position cancels linked TP/SL', () => {
    const s = createTradingSession()
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', PRICE)
    const pos = s.getPositions()[0]!
    s.setSelectedPositionId(pos.positionId)
    s.registerAutoProtection(50, 50, 100)
    expect(
      s.getPendingOrders().filter((o) => o.positionId === pos.positionId).length,
    ).toBe(2)
    s.closePosition(pos.positionId, 100)
    expect(
      s.getPendingOrders().filter(
        (o) => o.positionId === pos.positionId && o.status === 'pending',
      ).length,
    ).toBe(0)
  })

  it('risk line mock for open position', () => {
    const s = createTradingSession()
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', PRICE)
    const pos = s.getPositions()[0]!
    const liq = mockLiquidationPrice(pos, PRICE)
    expect(riskLineForPositions(s.getPositions(), 'BTCUSDT', PRICE)).toBe(liq)
  })
})
