import { beforeEach, describe, expect, it } from 'vitest'
import {
  canRegisterBookMit,
  roundMitTriggerPrice,
} from '../integration/ladderMitBridge.ts'
import {
  clearCoinMitQueuesForTests,
  getCoreMitTriggerForEngine,
  listCoinMitQueue,
} from '../integration/coinMitBridge.ts'
import { createTradingSession } from '../engine/tradingSession.ts'
import {
  COIN_SYMBOL_CONFIG,
  KOREA_STOCK_SYMBOL_CONFIG,
  OVERSEAS_SYMBOL_CONFIG,
  US_STOCK_SYMBOL_CONFIG,
  type ProductType,
} from '../types/productTypes.ts'

const FOUR: { product: ProductType; symbol: string; price: number }[] = [
  { product: 'COIN_FUTURES', symbol: 'BTCUSDT', price: COIN_SYMBOL_CONFIG.BTCUSDT.basePrice },
  {
    product: 'OVERSEAS_FUTURES',
    symbol: 'ESZ6',
    price: OVERSEAS_SYMBOL_CONFIG.ESZ6.basePrice,
  },
  { product: 'US_STOCK', symbol: 'AAPL', price: US_STOCK_SYMBOL_CONFIG.AAPL.basePrice },
  {
    product: 'KOREA_STOCK',
    symbol: '005930',
    price: KOREA_STOCK_SYMBOL_CONFIG['005930'].basePrice,
  },
]

describe('post-freeze / book STOP column unify (§6b)', () => {
  beforeEach(() => {
    clearCoinMitQueuesForTests()
  })

  it('all four engine products allow book STOP registration', () => {
    for (const { product, symbol } of FOUR) {
      expect(canRegisterBookMit(product, symbol)).toBe(true)
    }
  })

  it('KRX tick rounds book MIT trigger on 005930', () => {
    expect(roundMitTriggerPrice('KOREA_STOCK', '005930', 58_123)).toBe(58_100)
  })

  it.each(FOUR)('$product $symbol — registerMit + manualTick triggers one-way', ({
    product,
    symbol,
    price,
  }) => {
    const s = createTradingSession()
    s.setProduct(product)
    s.setSymbol(symbol)
    s.setLadderDirection('buy')
    const trigger = price + (product === 'KOREA_STOCK' ? 200 : 2)
    const id = s.registerMit(trigger, 'LONG', 'MIT')
    expect(id).toBeTruthy()
    s.manualTick(symbol, trigger)
    expect(s.getLastTrigger()?.kind).toBe('MIT')
    expect(s.getState().hedgeMode).toBe(false)
  })

  it('005930 core queue locks book price (no auto-follow)', () => {
    const s = createTradingSession()
    s.setProduct('KOREA_STOCK')
    const trigger = 58_200
    const id = s.registerMit(trigger, 'LONG', 'MIT')
    expect(getCoreMitTriggerForEngine('005930', id)).toBe(trigger)
    s.manualTick('005930', 59_000)
    expect(getCoreMitTriggerForEngine('005930', id)).toBe(trigger)
    expect(listCoinMitQueue('005930').length).toBeGreaterThan(0)
  })
})
