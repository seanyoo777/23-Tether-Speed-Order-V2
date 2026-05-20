import { describe, expect, it } from 'vitest'
import { DEFAULT_SHARED_ORDER_QTY } from '../types/productTypes.ts'
import { createHedgeEngine } from '../engine/hedgeEngine.ts'
import { createPositionStore } from '../engine/positionStore.ts'
import { validateLadderDirection } from '../engine/hedgeEngine.ts'

describe('hedgeEngine', () => {
  it('allows LONG and SHORT coexist', () => {
    const positions = createPositionStore()
    const hedge = createHedgeEngine({ positions })
    hedge.openLeg({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      side: 'LONG',
      qty: DEFAULT_SHARED_ORDER_QTY,
      fillPrice: 97_420,
      createdAt: 1,
    })
    hedge.openLeg({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      side: 'SHORT',
      qty: DEFAULT_SHARED_ORDER_QTY,
      fillPrice: 97_420,
      createdAt: 2,
    })
    expect(positions.list()).toHaveLength(2)
  })

  it('closes LONG only on partial', () => {
    const positions = createPositionStore()
    const hedge = createHedgeEngine({ positions })
    const long = hedge.openLeg({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      side: 'LONG',
      qty: 0.05,
      fillPrice: 97_420,
      createdAt: 1,
    })
    const short = hedge.openLeg({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      side: 'SHORT',
      qty: 0.05,
      fillPrice: 97_420,
      createdAt: 2,
    })
    hedge.closePercent(long.positionId, 50, 97_500)
    expect(positions.get(long.positionId)?.qty).toBeCloseTo(0.025)
    expect(positions.get(short.positionId)?.qty).toBe(0.05)
  })

  it('locks ladder direction', () => {
    expect(validateLadderDirection('buy', 'order-left').ok).toBe(false)
    expect(validateLadderDirection('sell', 'order-right').ok).toBe(false)
  })
})
