import { describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'
import { COIN_SYMBOL_CONFIG } from '../types/productTypes.ts'

const PRICE = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice

describe('hedge exchange UI session', () => {
  function hedgeSession() {
    const s = createTradingSession()
    s.setHedgeMode(true)
    return s
  }

  it('exchange buy/sell holds dual legs', () => {
    const s = hedgeSession()
    s.setSharedOrderQty(0.05)
    expect(s.placeHedgeExchangeOrder('buy', PRICE).ok).toBe(true)
    expect(s.placeHedgeExchangeOrder('sell', PRICE).ok).toBe(true)
    expect(s.getPositions().some((p) => p.side === 'LONG')).toBe(true)
    expect(s.getPositions().some((p) => p.side === 'SHORT')).toBe(true)
  })

  it('MIT with positionId closes leg on trigger', () => {
    const s = hedgeSession()
    s.setSharedOrderQty(0.05)
    s.placeHedgeExchangeOrder('buy', PRICE)
    const pos = s.getPositions().find((p) => p.side === 'LONG')!
    const id = s.registerMit(PRICE, 'LONG', 'MIT', pos.positionId)
    s.manualTick('BTCUSDT', PRICE)
    expect(s.getPendingMitStop().find((o) => o.id === id)).toBeUndefined()
    expect(s.getPositions().find((p) => p.positionId === pos.positionId)).toBeUndefined()
  })

  it('hedgeOpenLeg deprecated path still works', () => {
    const s = hedgeSession()
    expect(s.hedgeOpenLeg('LONG').ok).toBe(true)
  })
})
