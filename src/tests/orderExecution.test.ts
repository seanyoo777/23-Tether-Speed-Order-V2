import { describe, expect, it } from 'vitest'
import { createAuditEngine } from '../engine/auditEngine.ts'
import { createHedgeEngine } from '../engine/hedgeEngine.ts'
import { createOrderExecution } from '../engine/orderExecution.ts'
import { createOrderStore } from '../engine/orderStore.ts'
import { createPositionStore } from '../engine/positionStore.ts'

describe('orderExecution', () => {
  it('fills LONG from buy mode right column', () => {
    const positions = createPositionStore()
    const orders = createOrderStore()
    const audit = createAuditEngine()
    const hedge = createHedgeEngine({ positions })
    const execution = createOrderExecution({
      hedge,
      positions,
      orders,
      audit,
      getUseHedgeLegs: () => false,
    })

    const r = execution.fillLadderLimit({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      ladderDirection: 'buy',
      column: 'order-right',
      price: 97_420,
      qty: 0.05,
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(positions.get(r.positionId)?.side).toBe('LONG')
    }
  })

  it('rejects opposite column in buy mode', () => {
    const positions = createPositionStore()
    const orders = createOrderStore()
    const audit = createAuditEngine()
    const hedge = createHedgeEngine({ positions })
    const execution = createOrderExecution({
      hedge,
      positions,
      orders,
      audit,
      getUseHedgeLegs: () => false,
    })

    const r = execution.fillLadderLimit({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      ladderDirection: 'buy',
      column: 'order-left',
      price: 97_420,
      qty: 0.05,
    })
    expect(r.ok).toBe(false)
    expect(positions.list()).toHaveLength(0)
  })
})
