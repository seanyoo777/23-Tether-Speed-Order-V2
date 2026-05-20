import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildLadderRows } from '../engine/ladderPrices.ts'
import { validateLadderDirection } from '../engine/hedgeEngine.ts'
import { createOrderExecution } from '../engine/orderExecution.ts'
import { createAuditEngine } from '../engine/auditEngine.ts'
import { createHedgeEngine } from '../engine/hedgeEngine.ts'
import { createOrderStore } from '../engine/orderStore.ts'
import { createPositionStore } from '../engine/positionStore.ts'
import { runSelfTests } from '../engine/selfTest.ts'
import { createTradingSession } from '../engine/tradingSession.ts'
import { COIN_SYMBOL_CONFIG, DEFAULT_SHARED_ORDER_QTY } from '../types/productTypes.ts'
import { markersForSymbol, type CompactMode } from '../ui/proTrader.ts'
import { MSG_BUY_MODE_BLOCK, MSG_SELL_MODE_BLOCK } from '../types/tradingTypes.ts'
import {
  STABLE_23_MULTI_WORKSPACE_V1,
  STABLE_23_PRO_WORKFLOW_V1,
  STABLE_23_VISUAL_DEPTH_V1,
  STABLE_23_COIN_MOCK_V1,
  STABLE_23_MOCK_V1,
  STABLE_23_CURRENT,
} from '../workspace/stableTag.ts'
import { SessionRegistry } from '../workspace/sessionRegistry.ts'
import { clearSessionStorage } from '../workspace/sessionPersistence.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const PRICE = 97_420
const QTY = DEFAULT_SHARED_ORDER_QTY

function freshSession() {
  return createTradingSession()
}

describe('smoke / QA lock', () => {
  it('stable tag STABLE_23_MOCK_V1 (current)', () => {
    expect(STABLE_23_MOCK_V1).toBe('STABLE_23_MOCK_V1')
    expect(STABLE_23_CURRENT).toBe(STABLE_23_MOCK_V1)
  })

  it('prior stable tag STABLE_23_COIN_MOCK_V1', () => {
    expect(STABLE_23_COIN_MOCK_V1).toBe('STABLE_23_COIN_MOCK_V1')
  })

  it('six-product switch smoke', () => {
    const s = freshSession()
    const chain = [
      ['KOREA_FUTURES', 'KOSPI200F'],
      ['OVERSEAS_FUTURES', 'ESZ6'],
      ['US_STOCK', 'AAPL'],
      ['KOREA_STOCK', '005930'],
      ['COIN_FUTURES', 'BTCUSDT'],
      ['COIN_OPTIONS', 'BTC_97000_C'],
    ] as const
    for (const [product, symbol] of chain) {
      s.setProduct(product)
      expect(s.getState().symbol).toBe(symbol)
      expect(s.getState().hedgeMode).toBe(false)
      expect(s.placePanelOrder('buy').ok).toBe(true)
    }
  })

  it('prior stable tag STABLE_23_VISUAL_DEPTH_V1', () => {
    expect(STABLE_23_VISUAL_DEPTH_V1).toBe('STABLE_23_VISUAL_DEPTH_V1')
  })

  it('prior stable tag STABLE_23_PRO_WORKFLOW_V1', () => {
    expect(STABLE_23_PRO_WORKFLOW_V1).toBe('STABLE_23_PRO_WORKFLOW_V1')
  })

  it('prior stable tag STABLE_23_MULTI_WORKSPACE_V1', () => {
    expect(STABLE_23_MULTI_WORKSPACE_V1).toBe('STABLE_23_MULTI_WORKSPACE_V1')
  })

  it('coin session defaults one-way (hedge OFF)', () => {
    const s = freshSession()
    expect(s.getState().hedgeMode).toBe(false)
  })

  it('OVERSEAS_FUTURES ESZ6 engine-ready', () => {
    const s = freshSession()
    s.setProduct('OVERSEAS_FUTURES')
    expect(s.getState().symbol).toBe('ESZ6')
    expect(s.getState().hedgeMode).toBe(false)
  })

  it('US_STOCK AAPL engine-ready', () => {
    const s = freshSession()
    s.setProduct('US_STOCK')
    expect(s.getState().symbol).toBe('AAPL')
    expect(s.getState().hedgeMode).toBe(false)
    expect(s.placePanelOrder('buy').ok).toBe(true)
  })

  it('KOREA_STOCK 005930 engine-ready', () => {
    const s = freshSession()
    s.setProduct('KOREA_STOCK')
    expect(s.getState().symbol).toBe('005930')
    expect(s.getState().hedgeMode).toBe(false)
  })

  it('KOREA_FUTURES KOSPI200F engine-ready', () => {
    const s = freshSession()
    s.setProduct('KOREA_FUTURES')
    expect(s.getState().symbol).toBe('KOSPI200F')
    expect(s.placePanelOrder('buy').ok).toBe(true)
  })

  it('COIN_OPTIONS BTC_97000_C engine-ready', () => {
    const s = freshSession()
    s.setProduct('COIN_OPTIONS')
    expect(s.getState().symbol).toBe('BTC_97000_C')
    expect(s.getState().hedgeMode).toBe(false)
  })

  it('order flow plan produces slices', async () => {
    const { planLadderFill } = await import('../orderFlow/flowEngine.ts')
    const plan = planLadderFill({
      symbol: 'BTCUSDT',
      column: 'order-right',
      limitPrice: PRICE,
      totalQty: 0.05,
      lastPrice: PRICE,
      latencyMode: 'volatile',
      flowSeed: 7,
    })
    expect(plan.slices.length).toBeGreaterThanOrEqual(2)
  })

  it('THEME2 foundation presets exist', async () => {
    const { createTheme2Workspace } = await import('../theme/theme2Presets.ts')
    const ws = createTheme2Workspace()
    expect(ws.panels.chart1).toBeDefined()
    expect(ws.panels.ladder.detached).toBe(true)
  })

  it('self-test engine PASS', () => {
    expect(runSelfTests().status).toBe('PASS')
  })

  it('HTS core architecture self-test PASS', async () => {
    const { runHtsCoreSelfTests } = await import('../core/selfTest/htsCoreSelfTest.ts')
    expect(runHtsCoreSelfTests().status).toBe('PASS')
  })

  it('dist exists after build', () => {
    expect(existsSync(join(root, 'dist', 'index.html'))).toBe(true)
  })
})

describe('smoke / STABLE_23_MULTI_WORKSPACE_V1', () => {
  beforeEach(() => {
    clearSessionStorage()
  })

  it('M1 BTC·ETH 탭 세션 격리', () => {
    const reg = new SessionRegistry()
    const btc = reg.getOrCreate('tab-btc', 'BTCUSDT')
    const eth = reg.getOrCreate('tab-eth', 'ETHUSDT')
    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', PRICE)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', COIN_SYMBOL_CONFIG.ETHUSDT.basePrice)
    expect(btc.getPositions().every((p) => p.symbol === 'BTCUSDT')).toBe(true)
    expect(eth.getPositions().every((p) => p.symbol === 'ETHUSDT')).toBe(true)
    expect(btc).not.toBe(eth)
  })

  it('M2 BTC 청산 시 ETH 포지션 유지', () => {
    const reg = new SessionRegistry()
    const btc = reg.getOrCreate('tab-btc', 'BTCUSDT')
    const eth = reg.getOrCreate('tab-eth', 'ETHUSDT')
    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', PRICE)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', COIN_SYMBOL_CONFIG.ETHUSDT.basePrice)
    const ethN = eth.getPositions().length
    btc.closePosition(btc.getPositions()[0]!.positionId, 100)
    expect(btc.getPositions().filter((p) => p.qty > 0)).toHaveLength(0)
    expect(eth.getPositions().length).toBe(ethN)
  })
})

describe('smoke / STABLE_23_VISUAL_DEPTH_V1', () => {
  it('V1 depth book heatmap + velocity', async () => {
    const { buildDepthBookVisual } = await import('../visualDepth/depthEngine.ts')
    const book = buildDepthBookVisual({
      symbol: 'BTCUSDT',
      lastPrice: PRICE,
      tick: 0.5,
      rows: [
        { index: 14, price: PRICE + 5, isCurrent: false },
        { index: 15, price: PRICE, isCurrent: true },
        { index: 16, price: PRICE - 5, isCurrent: false },
      ],
      midIndex: 1,
      tickDirection: 'up',
      version: 3,
      mode: 'normal',
    })
    expect(book.velocity).toBeGreaterThan(0)
    expect(book.aggressiveSide).toBe('buy')
    const ask = book.rows.get(14)
    expect(ask?.askQty).toBeGreaterThan(0)
    expect(ask?.askCumPct).toBeGreaterThan(0)
  })

  it('V2 volatile mode panic + spread', async () => {
    const { buildDepthBookVisual } = await import('../visualDepth/depthEngine.ts')
    const book = buildDepthBookVisual({
      symbol: 'BTCUSDT',
      lastPrice: PRICE,
      tick: 0.5,
      rows: [
        { index: 14, price: PRICE + 5, isCurrent: false },
        { index: 15, price: PRICE, isCurrent: true },
        { index: 16, price: PRICE - 5, isCurrent: false },
      ],
      midIndex: 1,
      tickDirection: 'down',
      version: 8,
      mode: 'volatile',
    })
    expect(book.panicMode).toBe(true)
    expect(book.aggressiveSide).toBe('sell')
    expect(book.spread).toBeGreaterThan(0)
  })
})

describe('smoke / STABLE_23_PRO_WORKFLOW_V1', () => {
  beforeEach(() => {
    clearSessionStorage()
  })

  it('P1 reversePosition flips side', () => {
    const s = createTradingSession({ bindSymbol: 'BTCUSDT' })
    s.setSymbol('BTCUSDT')
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', PRICE)
    const pos = s.getPositions()[0]!
    expect(pos.side).toBe('LONG')
    const r = s.reversePosition(pos.positionId)
    expect(r.ok).toBe(true)
    expect(s.getPositions()[0]!.side).toBe('SHORT')
  })

  it('P2 flattenAll only active symbol session', () => {
    const reg = new SessionRegistry()
    const btc = reg.getOrCreate('tab-btc', 'BTCUSDT')
    const eth = reg.getOrCreate('tab-eth', 'ETHUSDT')
    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', PRICE)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', COIN_SYMBOL_CONFIG.ETHUSDT.basePrice)
    const r = btc.flattenAll()
    expect(r.ok).toBe(true)
    expect(btc.getPositions().filter((p) => p.qty > 0)).toHaveLength(0)
    expect(eth.getPositions().filter((p) => p.qty > 0)).toHaveLength(1)
  })
})

describe('smoke / direction lock', () => {
  it('매수전환 + 오른쪽 클릭 = LONG', () => {
    const s = freshSession()
    s.setLadderDirection('buy')
    const r = s.placeLadderOrder('order-right', PRICE)
    expect(r.ok).toBe(true)
    expect(s.getPositions().some((p) => p.side === 'LONG')).toBe(true)
  })

  it('매수전환 + 왼쪽 클릭 = 차단', () => {
    expect(validateLadderDirection('buy', 'order-left').ok).toBe(false)
    const s = freshSession()
    s.setLadderDirection('buy')
    const positions = createPositionStore()
    const orders = createOrderStore()
    const exec = createOrderExecution({
      hedge: createHedgeEngine({ positions }),
      positions,
      orders,
      audit: createAuditEngine(),
      getUseHedgeLegs: () => false,
    })
    const r = exec.fillLadderLimit({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      ladderDirection: 'buy',
      column: 'order-left',
      price: PRICE,
      qty: QTY,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toBe(MSG_BUY_MODE_BLOCK)
    expect(s.getPositions().filter((p) => p.side === 'SHORT')).toHaveLength(0)
  })

  it('매도전환 + 왼쪽 클릭 = SHORT', () => {
    const s = freshSession()
    s.setLadderDirection('sell')
    const r = s.placeLadderOrder('order-left', PRICE)
    expect(r.ok).toBe(true)
    expect(s.getPositions().some((p) => p.side === 'SHORT')).toBe(true)
  })

  it('매도전환 + 오른쪽 클릭 = 차단', () => {
    expect(validateLadderDirection('sell', 'order-right').ok).toBe(false)
    const positions = createPositionStore()
    const orders = createOrderStore()
    const exec = createOrderExecution({
      hedge: createHedgeEngine({ positions }),
      positions,
      orders,
      audit: createAuditEngine(),
      getUseHedgeLegs: () => false,
    })
    const r = exec.fillLadderLimit({
      productType: 'COIN_FUTURES',
      symbol: 'BTCUSDT',
      ladderDirection: 'sell',
      column: 'order-right',
      price: PRICE,
      qty: QTY,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toBe(MSG_SELL_MODE_BLOCK)
  })
})

describe('smoke / qty & hedge close', () => {
  it('sharedOrderQty +0.05 반영', () => {
    const s = freshSession()
    s.setSharedOrderQty(0.05)
    s.setSharedOrderQty(s.getState().sharedOrderQty + 0.05)
    expect(s.getState().sharedOrderQty).toBeCloseTo(0.1, 6)
  })

  it('LONG 50% 청산 시 SHORT 유지', () => {
    const s = freshSession()
    s.setHedgeMode(true)
    s.hedgeOpenLeg('LONG')
    s.hedgeOpenLeg('SHORT')
    const long = s.getPositions().find((p) => p.side === 'LONG')!
    const short = s.getPositions().find((p) => p.side === 'SHORT')!
    s.closePosition(long.positionId, 50)
    expect(s.getPositions().find((p) => p.positionId === long.positionId)?.qty).toBeCloseTo(
      QTY / 2,
      6,
    )
    expect(s.getPositions().find((p) => p.positionId === short.positionId)?.qty).toBe(QTY)
  })
})

describe('smoke / MIT & orders', () => {
  it('MIT marker 표시 (pending → markersForSymbol)', () => {
    const s = freshSession()
    const id = s.registerMit(PRICE + 20, 'LONG', 'MIT')
    expect(id).toBeTruthy()
    const markers = markersForSymbol(s.getPendingOrders(), 'BTCUSDT')
    expect(markers.some((m) => m.kind === 'MIT' && m.label === 'MIT')).toBe(true)
  })

  it('미체결 행 취소', () => {
    const s = freshSession()
    const id = s.registerMit(PRICE + 10, 'LONG', 'MIT')
    expect(s.cancelOrder(id)).toBe(true)
    expect(s.getPendingOrders().find((o) => o.id === id)).toBeUndefined()
  })

  it('미체결 전체취소', () => {
    const s = freshSession()
    s.registerMit(PRICE + 10, 'LONG', 'MIT')
    s.registerMit(PRICE - 10, 'SHORT', 'STOP')
    const n = s.cancelAllOrders('BTCUSDT')
    expect(n).toBeGreaterThanOrEqual(2)
    expect(s.getPendingOrders()).toHaveLength(0)
  })
})

describe('smoke / ladder pin', () => {
  it('호가고정 ON: center 가격 유지', () => {
    const cfg = COIN_SYMBOL_CONFIG.BTCUSDT
    const pin = 97_420
    const moved = 97_500
    const pinnedRows = buildLadderRows(moved, cfg, true, pin)
    const followRows = buildLadderRows(moved, cfg, false)
    const pinnedMid = pinnedRows.find((r) => r.index === 15)!.price
    const followMid = followRows.find((r) => r.index === 15)!.price
    expect(pinnedMid).not.toBe(followMid)
    const pinnedAt97420 = buildLadderRows(pin, cfg, true, pin)
    expect(pinnedAt97420.find((r) => r.index === 15)!.price).toBe(pinnedMid)
  })

  it('호가고정 OFF: lastPrice 기준 center 이동', () => {
    const cfg = COIN_SYMBOL_CONFIG.BTCUSDT
    const a = buildLadderRows(97_420, cfg, false)
    const b = buildLadderRows(97_430, cfg, false)
    expect(a.find((r) => r.index === 15)!.price).not.toBe(
      b.find((r) => r.index === 15)!.price,
    )
  })
})

describe('smoke / pro-trader contract', () => {
  it('원클릭 OFF: 2회 placeLadderOrder = 체결 2회 (confirm 흐름 엔진 동등)', () => {
    const s = freshSession()
    s.setLadderDirection('buy')
    const a = s.placeLadderOrder('order-right', PRICE)
    const b = s.placeLadderOrder('order-right', PRICE + 10)
    expect(a.ok && b.ok).toBe(true)
    const filledLong = s
      .getOrders()
      .filter((o) => o.side === 'LONG' && o.status === 'filled')
    expect(filledLong.length).toBe(2)
  })

  it('F1/F2 compact mode 타입 (UI 수동 검증 보조)', () => {
    const modes: CompactMode[] = ['normal', 'ultra']
    expect(modes).toContain('ultra')
    expect(modes).toContain('normal')
  })
})
