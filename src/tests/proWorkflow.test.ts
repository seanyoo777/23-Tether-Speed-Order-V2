import { beforeEach, describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'
import { COIN_SYMBOL_CONFIG, DEFAULT_SHARED_ORDER_QTY } from '../types/productTypes.ts'
import {
  clearWorkflowPrefs,
  loadWorkflowPrefs,
  saveWorkflowPrefs,
} from '../proWorkflow/workflowPrefs.ts'
import { SessionRegistry } from '../workspace/sessionRegistry.ts'
import { clearSessionStorage } from '../workspace/sessionPersistence.ts'

const BTC = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice
const QTY = DEFAULT_SHARED_ORDER_QTY

describe('PHASE_PRO_TRADING_WORKFLOW', () => {
  beforeEach(() => {
    clearWorkflowPrefs()
    clearSessionStorage()
  })

  it('reversePosition flips side with symbol guard', () => {
    const s = createTradingSession({ bindSymbol: 'BTCUSDT' })
    s.setSymbol('BTCUSDT')
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', BTC)
    const pos = s.getPositions()[0]!
    expect(pos.side).toBe('LONG')

    const r = s.reversePosition(pos.positionId)
    expect(r.ok).toBe(true)
    const after = s.getPositions().filter((p) => p.qty > 0)
    expect(after).toHaveLength(1)
    expect(after[0]!.side).toBe('SHORT')
    expect(after[0]!.qty).toBeCloseTo(QTY, 6)
  })

  it('scaleIn adds qty on same leg', () => {
    const s = createTradingSession({ bindSymbol: 'BTCUSDT' })
    s.setSymbol('BTCUSDT')
    s.setSharedOrderQty(QTY)
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', BTC)
    const pos = s.getPositions()[0]!
    const r = s.scaleIn(pos.positionId)
    expect(r.ok).toBe(true)
    expect(s.getPositions()[0]!.qty).toBeCloseTo(QTY * 2, 6)
  })

  it('flattenAll closes only bound symbol', () => {
    const reg = new SessionRegistry()
    const btc = reg.getOrCreate('tab-btc', 'BTCUSDT')
    const eth = reg.getOrCreate('tab-eth', 'ETHUSDT')
    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', BTC)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder(
      'order-left',
      COIN_SYMBOL_CONFIG.ETHUSDT.basePrice,
    )

    const r = btc.flattenAll()
    expect(r.ok).toBe(true)
    expect(r.closed).toBe(1)
    expect(btc.getPositions().filter((p) => p.qty > 0)).toHaveLength(0)
    expect(eth.getPositions().filter((p) => p.qty > 0)).toHaveLength(1)
  })

  it('closePosition rejects wrong symbol', () => {
    const s = createTradingSession({ bindSymbol: 'BTCUSDT' })
    s.setSymbol('BTCUSDT')
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', BTC)
    const pos = s.getPositions()[0]!
    s.setSymbol('ETHUSDT')
    const r = s.closePosition(pos.positionId, 100)
    expect(r.ok).toBe(false)
  })

  it('workflow prefs persist', () => {
    saveWorkflowPrefs({
      symbolSync: true,
      workspaceAutoRestore: true,
      compactTape: true,
    })
    expect(loadWorkflowPrefs().symbolSync).toBe(true)
  })
})
