import {
  COIN_SYMBOL_CONFIG,
  DEFAULT_SHARED_ORDER_QTY,
} from '../types/productTypes.ts'
import { validateLadderDirection } from './hedgeEngine.ts'
import { createHedgeEngine } from './hedgeEngine.ts'
import { shouldFillMit } from './mitStopEngine.ts'
import { createMockTicker } from './mockTicker.ts'
import { unrealizedPnl, protectionPrices } from './pnlEngine.ts'
import { createPositionStore } from './positionStore.ts'
import { createTradingSession } from './tradingSession.ts'

export type SelfTestVerdict = 'PASS' | 'WARN' | 'FAIL'

export type SelfTestRow = {
  id: string
  verdict: SelfTestVerdict
  detail: string
}

export function runSelfTests(): { status: SelfTestVerdict; rows: SelfTestRow[] } {
  const rows: SelfTestRow[] = []

  const pass = (id: string, detail: string) => rows.push({ id, verdict: 'PASS', detail })
  const fail = (id: string, detail: string) => rows.push({ id, verdict: 'FAIL', detail })

  const positions = createPositionStore()
  const hedge = createHedgeEngine({ positions })

  const long = hedge.openLeg({
    productType: 'COIN_FUTURES',
    symbol: 'BTCUSDT',
    side: 'LONG',
    qty: DEFAULT_SHARED_ORDER_QTY,
    fillPrice: 97_420,
    createdAt: 1,
  })
  pass('hedge-long-create', long.side)

  const short = hedge.openLeg({
    productType: 'COIN_FUTURES',
    symbol: 'BTCUSDT',
    side: 'SHORT',
    qty: DEFAULT_SHARED_ORDER_QTY,
    fillPrice: 97_420,
    createdAt: 2,
  })
  pass('hedge-short-create', short.side)

  const both = positions.list()
  if (both.length === 2) pass('hedge-long-short-coexist', '2 legs')
  else fail('hedge-long-short-coexist', `count=${both.length}`)

  const closeLong = hedge.closePercent(long.positionId, 50, 97_500)
  if (closeLong.ok && closeLong.position && closeLong.position.qty < DEFAULT_SHARED_ORDER_QTY) {
    pass('hedge-close-long-only', `qty=${closeLong.position.qty}`)
  } else fail('hedge-close-long-only', 'partial failed')

  const shortStill = positions.get(short.positionId)
  if (shortStill && shortStill.qty === DEFAULT_SHARED_ORDER_QTY) {
    pass('hedge-close-short-only', 'SHORT unchanged')
  } else fail('hedge-close-short-only', 'SHORT touched')

  const session = createTradingSession()
  if (session.getState().sharedOrderQty === DEFAULT_SHARED_ORDER_QTY) {
    pass('shared-qty-consistency', String(DEFAULT_SHARED_ORDER_QTY))
  } else fail('shared-qty-consistency', 'mismatch')

  const buyBlock = validateLadderDirection('buy', 'order-left')
  if (!buyBlock.ok) pass('ladder-direction-lock-buy', buyBlock.message)
  else fail('ladder-direction-lock-buy', 'should block')

  const sellBlock = validateLadderDirection('sell', 'order-right')
  if (!sellBlock.ok) pass('ladder-direction-lock-sell', sellBlock.message)
  else fail('ladder-direction-lock-sell', 'should block')

  const mt = createMockTicker(['BTCUSDT'], { autoTick: false })
  mt.manualTick('BTCUSDT', 97_430)
  if (mt.getLastPrice('BTCUSDT') === 97_430) pass('mock-ticker-manual-tick', '97430')
  else fail('mock-ticker-manual-tick', 'price')

  if (shouldFillMit('LONG', 97_430, 97_430, 97_420)) {
    pass('mit-buy-trigger', 'filled at trigger')
  } else fail('mit-buy-trigger', 'no trigger')

  if (shouldFillMit('SHORT', 97_410, 97_410, 97_420)) {
    pass('mit-sell-trigger', 'filled at trigger')
  } else fail('mit-sell-trigger', 'no trigger')

  const tick = COIN_SYMBOL_CONFIG.BTCUSDT.tick
  const upnl = unrealizedPnl(
    { side: 'LONG', qty: 1, avgPrice: 97_420 },
    97_500,
  )
  if (upnl > 0) pass('pnl-long', String(upnl))
  else fail('pnl-long', String(upnl))

  const spnl = unrealizedPnl(
    { side: 'SHORT', qty: 1, avgPrice: 97_420 },
    97_400,
  )
  if (spnl > 0) pass('pnl-short', String(spnl))
  else fail('pnl-short', String(spnl))

  const prot = protectionPrices('LONG', 97_420, tick, 100, 100)
  if (prot.tpPrice > 97_420 && prot.slPrice < 97_420) {
    pass('protection-prices-long', `${prot.tpPrice}/${prot.slPrice}`)
  } else fail('protection-prices-long', 'bad prices')

  const hasFail = rows.some((r) => r.verdict === 'FAIL')
  const status: SelfTestVerdict = hasFail ? 'FAIL' : 'PASS'
  return { status, rows }
}
