import { describe, expect, it } from 'vitest'
import { runHtsCoreSelfTests } from '../core/selfTest/htsCoreSelfTest.ts'
import { ALL_ORDER_INTENTS } from '../core/orderIntent/validators.ts'
import { createConditionalOrderQueue } from '../core/conditionalOrder/queueEngine.ts'
import { createMarketStreamRouter } from '../core/marketStream/router.ts'
import { requireSymbolSpec } from '../core/symbolSpec/engine.ts'
import { getProductAdapter } from '../core/productAdapter/factory.ts'
import { createLegStore } from '../core/positionLeg/legStore.ts'
import { HTS_CORE_MOCK_ONLY } from '../core/contracts/mockOnly.ts'

describe('HTS Core Architecture', () => {
  it('runHtsCoreSelfTests PASS', () => {
    const result = runHtsCoreSelfTests()
    const failed = result.rows.filter((r) => !r.pass)
    if (failed.length > 0) {
      console.error(failed)
    }
    expect(result.status).toBe('PASS')
  })

  it('symbol-spec-schema — BTCUSDT tick', () => {
    const spec = requireSymbolSpec('BTCUSDT')
    expect(spec.tickSize).toBe(0.5)
    expect(spec.mockOnly).toBe(true)
  })

  it('order-intent-separated — 12 intents', () => {
    expect(ALL_ORDER_INTENTS.length).toBe(12)
  })

  it('hedge-position-leg-separated', () => {
    const store = createLegStore()
    store.upsertLeg('coin', 'BTCUSDT', 'LONG', { qty: 1, avgPrice: 100 })
    store.upsertLeg('coin', 'BTCUSDT', 'SHORT', { qty: 1, avgPrice: 101 })
    const book = store.getBook('coin', 'BTCUSDT')
    expect(book.longLeg?.qty).toBe(1)
    expect(book.shortLeg?.qty).toBe(1)
  })

  it('mit-trigger-lock', () => {
    const q = createConditionalOrderQueue()
    const row = q.register({
      symbol: 'BTCUSDT',
      clickPrice: 100,
      intent: 'MIT_OPEN_LONG',
      hedgeSide: 'LONG',
      reduceOnly: false,
    })
    q.onMarketTick('BTCUSDT', 200)
    expect(q.list('BTCUSDT')[0]?.triggerPrice).toBe(row.triggerPrice)
  })

  it('no-real-api-no-websocket — single router connection', () => {
    const router = createMarketStreamRouter()
    expect(router.connectionCount()).toBe(1)
  })

  it('mock-only-contract', () => {
    expect(HTS_CORE_MOCK_ONLY).toBe(true)
  })

  it('product-adapter-contract', () => {
    const spec = requireSymbolSpec('AAPL')
    const adapter = getProductAdapter(spec.marketType)
    expect(adapter.formatPrice(spec, 190.12)).toBe('190.12')
  })
})
