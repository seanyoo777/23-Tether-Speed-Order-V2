import { describe, expect, it } from 'vitest'
import { COIN_SYMBOL_CONFIG } from '../types/productTypes.ts'
import { pnlPercent, protectionPrices, unrealizedPnl } from '../engine/pnlEngine.ts'

describe('pnlEngine', () => {
  it('computes LONG profit', () => {
    const pnl = unrealizedPnl(
      { side: 'LONG', qty: 0.05, avgPrice: 97_420 },
      97_500,
    )
    expect(pnl).toBeGreaterThan(0)
  })

  it('computes SHORT profit when price drops', () => {
    const pnl = unrealizedPnl(
      { side: 'SHORT', qty: 0.05, avgPrice: 97_420 },
      97_400,
    )
    expect(pnl).toBeGreaterThan(0)
  })

  it('protection prices for LONG', () => {
    const tick = COIN_SYMBOL_CONFIG.BTCUSDT.tick
    const { tpPrice, slPrice } = protectionPrices('LONG', 97_420, tick, 100, 100)
    expect(tpPrice).toBeGreaterThan(97_420)
    expect(slPrice).toBeLessThan(97_420)
  })

  it('pnl percent', () => {
    const pct = pnlPercent({ side: 'LONG', avgPrice: 100 }, 110)
    expect(pct).toBeCloseTo(10, 1)
  })
})
