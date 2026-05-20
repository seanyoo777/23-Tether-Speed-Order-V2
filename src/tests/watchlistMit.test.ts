import { beforeEach, describe, expect, it } from 'vitest'
import { watchlistRowsForProduct } from '../integration/watchlistBridge.ts'
import {
  canRegisterBookMit,
  mitSideFromLadderMode,
  roundMitTriggerPrice,
} from '../integration/ladderMitBridge.ts'
import {
  cancelCoinMitByEngineOrder,
  clearCoinMitQueuesForTests,
  getCoreMitTriggerForEngine,
  listCoinMitQueue,
  relockCoinMitByEngineOrder,
} from '../integration/coinMitBridge.ts'
import { createTradingSession } from '../engine/tradingSession.ts'

describe('watchlist + book MIT', () => {
  beforeEach(() => {
    clearCoinMitQueuesForTests()
  })

  it('watchlist coin rows', () => {
    const rows = watchlistRowsForProduct('COIN_FUTURES')
    expect(rows.length).toBeGreaterThanOrEqual(3)
    expect(rows.every((r) => r.tradable)).toBe(true)
    expect(rows.some((r) => r.symbol === 'BTCUSDT')).toBe(true)
  })

  it('roundMitTriggerPrice uses core tick', () => {
    const p = roundMitTriggerPrice('COIN_FUTURES', 'BTCUSDT', 97_420.27)
    expect(p).toBe(97_420.5)
  })

  it('mitSideFromLadderMode', () => {
    expect(mitSideFromLadderMode('buy')).toBe('LONG')
    expect(mitSideFromLadderMode('sell')).toBe('SHORT')
  })

  it('registerMit from session locks book price in core queue', () => {
    expect(canRegisterBookMit('COIN_FUTURES', 'BTCUSDT')).toBe(true)
    const session = createTradingSession()
    session.setLadderDirection('buy')
    const id = session.registerMit(97_510, 'LONG', 'MIT')
    const q = listCoinMitQueue('BTCUSDT')
    expect(q.some((o) => o.triggerPrice === 97_510 && o.intent === 'MIT_OPEN_LONG')).toBe(
      true,
    )
    expect(getCoreMitTriggerForEngine('BTCUSDT', id)).toBe(97_510)
  })

  it('updateOrderTrigger relocks core MIT (no auto-follow)', () => {
    const session = createTradingSession()
    const id = session.registerMit(97_500, 'LONG', 'MIT')
    expect(session.updateOrderTrigger(id, 97_520.25)).toBe(true)
    expect(getCoreMitTriggerForEngine('BTCUSDT', id)).toBe(97_520.5)
    session.manualTick('BTCUSDT', 98_000)
    expect(getCoreMitTriggerForEngine('BTCUSDT', id)).toBe(97_520.5)
  })

  it('cancelOrder removes core MIT link', () => {
    const session = createTradingSession()
    const id = session.registerMit(97_500, 'LONG', 'MIT')
    expect(session.cancelOrder(id)).toBe(true)
    expect(getCoreMitTriggerForEngine('BTCUSDT', id)).toBeUndefined()
    expect(
      cancelCoinMitByEngineOrder('BTCUSDT', id),
    ).toBe(false)
  })

  it('relockCoinMitByEngineOrder rounds to tick', () => {
    const session = createTradingSession()
    const id = session.registerMit(97_500, 'LONG', 'MIT')
    expect(
      relockCoinMitByEngineOrder({
        product: 'COIN_FUTURES',
        symbol: 'BTCUSDT',
        engineOrderId: id,
        nextPrice: 97_501.3,
      }),
    ).toBe(true)
    expect(getCoreMitTriggerForEngine('BTCUSDT', id)).toBe(97_501.5)
  })
})
