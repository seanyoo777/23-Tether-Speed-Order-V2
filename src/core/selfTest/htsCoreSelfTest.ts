import { HTS_CORE_MOCK_ONLY } from '../contracts/mockOnly.ts'
import {
  assertAllowedConnectionKind,
  assertNoRealEndpoint,
  createMockStreamUrl,
} from '../contracts/noRealApi.ts'
import { createConditionalOrderQueue } from '../conditionalOrder/queueEngine.ts'
import { followMarketPrice } from '../conditionalOrder/triggerLock.ts'
import { detachedWindowContract } from '../detachedWindow/persistence.ts'
import { createDetachedWindowRegistry } from '../detachedWindow/registry.ts'
import { defaultDockLayout } from '../dock/dockLayout.ts'
import { layoutPersistenceContract } from '../layout/persistence.ts'
import { defaultHtsLayout, validateLayoutFractions } from '../layout/index.ts'
import { createMarketStreamRouter } from '../marketStream/router.ts'
import { MOCK_ONEAI_SIGNALS, oneAiFeedContract } from '../oneaiFeed/mockAdapter.ts'
import {
  ALL_ORDER_INTENTS,
  describeIntent,
  isCloseIntent,
} from '../orderIntent/index.ts'
import { createLegStore } from '../positionLeg/legStore.ts'
import { assertNoNetPositionField, bothLegsOpen } from '../positionLeg/hedgePositionView.ts'
import { getProductAdapter } from '../productAdapter/factory.ts'
import {
  listSymbolSpecs,
  requireSymbolSpec,
  validateSymbolSpec,
} from '../symbolSpec/index.ts'

export type HtsCoreSelfTestRow = {
  id: string
  pass: boolean
  detail: string
}

export function runHtsCoreSelfTests(): {
  status: 'PASS' | 'FAIL'
  rows: HtsCoreSelfTestRow[]
} {
  const rows: HtsCoreSelfTestRow[] = []
  const pass = (id: string, detail: string) =>
    rows.push({ id, pass: true, detail })
  const fail = (id: string, detail: string) =>
    rows.push({ id, pass: false, detail })

  // symbol-spec-schema
  for (const spec of listSymbolSpecs()) {
    const errs = validateSymbolSpec(spec)
    if (errs.length === 0) pass('symbol-spec-schema', spec.symbol)
    else fail('symbol-spec-schema', `${spec.symbol}:${errs.join(',')}`)
  }

  // product-adapter-contract
  const btc = requireSymbolSpec('BTCUSDT')
  const adapter = getProductAdapter(btc.marketType)
  const intents = adapter.allowedOrderIntents(btc)
  if (intents.includes('OPEN_LONG') && adapter.roundPrice(btc, 97_420.3) > 0) {
    pass('product-adapter-contract', `intents=${intents.length}`)
  } else fail('product-adapter-contract', 'adapter failed')

  // order-intent-separated
  const openLong = describeIntent('OPEN_LONG')
  const closeLong = describeIntent('CLOSE_LONG')
  if (openLong.isOpen && !openLong.reduceOnly && closeLong.reduceOnly && isCloseIntent('CLOSE_LONG')) {
    pass('order-intent-separated', 'open vs close')
  } else fail('order-intent-separated', 'intent meta mismatch')

  if (ALL_ORDER_INTENTS.length === 12) {
    pass('order-intent-separated', '12 intents')
  } else fail('order-intent-separated', `count=${ALL_ORDER_INTENTS.length}`)

  // hedge-position-leg-separated
  const legs = createLegStore()
  legs.upsertLeg('coin', 'BTCUSDT', 'LONG', { qty: 0.1, avgPrice: 97_000 })
  legs.upsertLeg('coin', 'BTCUSDT', 'SHORT', { qty: 0.05, avgPrice: 97_100 })
  const book = legs.getBook('coin', 'BTCUSDT')
  assertNoNetPositionField(book)
  if (bothLegsOpen(book)) {
    pass('hedge-position-leg-separated', 'long+short legs')
  } else fail('hedge-position-leg-separated', 'legs missing')

  try {
    legs.getNetQty('coin', 'BTCUSDT')
    fail('hedge-position-leg-separated', 'net allowed')
  } catch {
    pass('hedge-position-leg-separated', 'net forbidden')
  }

  // mit-trigger-lock
  const q = createConditionalOrderQueue()
  const mit = q.register({
    symbol: 'BTCUSDT',
    clickPrice: 97_500,
    intent: 'MIT_OPEN_LONG',
    hedgeSide: 'LONG',
    reduceOnly: false,
  })
  const before = mit.triggerPrice
  q.onMarketTick('BTCUSDT', 97_800)
  const after = q.list('BTCUSDT')[0]?.triggerPrice
  if (before === after && mit.locked) {
    pass('mit-trigger-lock', `fixed@${before}`)
  } else fail('mit-trigger-lock', `drift ${before}->${after}`)

  try {
    followMarketPrice(mit, 98_000)
    fail('mit-trigger-lock', 'follow allowed')
  } catch {
    pass('mit-trigger-lock', 'follow forbidden')
  }

  // layout-persistence-contract
  const layout = defaultHtsLayout()
  const lp = layoutPersistenceContract()
  if (lp.zoomSafe && validateLayoutFractions(layout)) {
    pass('layout-persistence-contract', lp.storageKey)
  } else fail('layout-persistence-contract', 'invalid fractions')

  // detached-window-contract
  const dwc = detachedWindowContract()
  const reg = createDetachedWindowRegistry()
  const win = reg.open({
    symbol: 'BTCUSDT',
    marketType: 'coin',
    linkedWorkspaceId: 'ws-1',
  })
  if (win.mode === dwc.defaultMode && win.mockOnly) {
    pass('detached-window-contract', win.windowId)
  } else fail('detached-window-contract', 'window contract')

  // oneai-feed-contract
  const feedContract = oneAiFeedContract()
  if (feedContract.importFrom03Forbidden && feedContract.mockOnly) {
    pass('oneai-feed-contract', 'no-03-import')
  } else fail('oneai-feed-contract', 'contract')

  if (MOCK_ONEAI_SIGNALS.every((s) => s.mockOnly)) {
    pass('oneai-feed-contract', `signals=${MOCK_ONEAI_SIGNALS.length}`)
  } else fail('oneai-feed-contract', 'mock signals')

  // no-real-api-no-websocket
  try {
    assertAllowedConnectionKind('real_ws', 'self-test')
    fail('no-real-api-no-websocket', 'real_ws allowed')
  } catch {
    pass('no-real-api-no-websocket', 'real_ws blocked')
  }
  try {
    assertNoRealEndpoint('wss://stream.binance.com/ws', 'self-test')
    fail('no-real-api-no-websocket', 'wss allowed')
  } catch {
    pass('no-real-api-no-websocket', 'wss blocked')
  }
  const router = createMarketStreamRouter()
  if (router.connectionCount() === 1 && createMockStreamUrl('x').startsWith('mock://')) {
    pass('no-real-api-no-websocket', 'single mock router')
  } else fail('no-real-api-no-websocket', 'router')

  // mock-only-contract
  if (HTS_CORE_MOCK_ONLY && defaultDockLayout().minimizePageScroll) {
    pass('mock-only-contract', 'HTS_CORE_MOCK_ONLY')
  } else fail('mock-only-contract', 'flag off')

  const status = rows.some((r) => !r.pass) ? 'FAIL' : 'PASS'
  return { status, rows }
}
