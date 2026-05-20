import { describe, expect, it } from 'vitest'
import { createOrderStore } from '../engine/orderStore.ts'
import {
  evaluateMitStopOnTick,
  registerMitOrder,
  shouldFillMit,
  shouldFillMitStopAtPrice,
} from '../engine/mitStopEngine.ts'
import { createTradingSession } from '../engine/tradingSession.ts'
import { COIN_SYMBOL_CONFIG } from '../types/productTypes.ts'

const TICK = COIN_SYMBOL_CONFIG.BTCUSDT.tick

describe('mitStopEngine', () => {
  it('MIT ≡ STOP: touch triggers', () => {
    expect(shouldFillMitStopAtPrice(97_430, 97_430, 97_420, TICK)).toBe(true)
    expect(shouldFillMit('LONG', 97_430, 97_430, 97_420, TICK)).toBe(true)
  })

  it('breakout up: cross from below', () => {
    expect(shouldFillMitStopAtPrice(97_430, 97_431, 97_429, TICK)).toBe(true)
  })

  it('breakout down: cross from above (상·하 동일)', () => {
    expect(shouldFillMitStopAtPrice(97_410, 97_409, 97_411, TICK)).toBe(true)
  })

  it('fills pending MIT on tick', () => {
    const orders = createOrderStore()
    const id = registerMitOrder(orders, {
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      side: 'LONG',
      triggerPrice: 97_430,
      qty: 0.05,
      kind: 'MIT',
    })
    const hits = evaluateMitStopOnTick(
      orders,
      'BTCUSDT',
      97_430,
      97_420,
      TICK,
    )
    expect(hits.some((h) => h.orderId === id)).toBe(true)
  })

  it('STOP uses same trigger as MIT', () => {
    const orders = createOrderStore()
    const id = registerMitOrder(orders, {
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      side: 'SHORT',
      triggerPrice: 97_410,
      qty: 0.05,
      kind: 'STOP',
    })
    const hits = evaluateMitStopOnTick(
      orders,
      'BTCUSDT',
      97_409,
      97_411,
      TICK,
    )
    expect(hits.some((h) => h.orderId === id && h.kind === 'STOP')).toBe(true)
  })

  it('session MIT flow', () => {
    const s = createTradingSession()
    s.registerMit(97_430, 'LONG', 'MIT')
    s.manualTick('BTCUSDT', 97_430)
    expect(s.getPositions().some((p) => p.side === 'LONG')).toBe(true)
  })
})
