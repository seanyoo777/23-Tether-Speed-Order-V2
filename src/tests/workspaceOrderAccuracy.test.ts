import { beforeEach, describe, expect, it } from 'vitest'
import { COIN_SYMBOL_CONFIG, DEFAULT_SHARED_ORDER_QTY } from '../types/productTypes.ts'
import { SessionRegistry } from '../workspace/sessionRegistry.ts'
import {
  clearSessionStorage,
  loadTabSession,
} from '../workspace/sessionPersistence.ts'
import { clearWorkspaceStorage, saveWorkspace } from '../workspace/storage.ts'
import { createDefaultWorkspace } from '../workspace/presets.ts'
import { isForeignSessionMessage } from '../workspace/popupBridge.ts'

const QTY = DEFAULT_SHARED_ORDER_QTY
const BTC = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice
const ETH = COIN_SYMBOL_CONFIG.ETHUSDT.basePrice
const SOL = COIN_SYMBOL_CONFIG.SOLUSDT.basePrice

function multiRegistry(): SessionRegistry {
  const reg = new SessionRegistry()
  reg.getOrCreate('tab-btc', 'BTCUSDT')
  reg.getOrCreate('tab-eth', 'ETHUSDT')
  reg.getOrCreate('tab-sol', 'SOLUSDT')
  return reg
}

describe('MULTI_WORKSPACE_ORDER_ACCURACY_QA', () => {
  beforeEach(() => {
    clearSessionStorage()
    clearWorkspaceStorage()
  })

  it('1. BTC 탭 LONG 0.05 진입', () => {
    const reg = multiRegistry()
    const btc = reg.get('tab-btc')!
    btc.setLadderDirection('buy')
    const r = btc.placeLadderOrder('order-right', BTC)
    expect(r.ok).toBe(true)
    const legs = btc.getPositions().filter((p) => p.symbol === 'BTCUSDT')
    expect(legs).toHaveLength(1)
    expect(legs[0]!.side).toBe('LONG')
    expect(legs[0]!.qty).toBeCloseTo(QTY, 6)
  })

  it('2. ETH 탭 SHORT 0.05 진입', () => {
    const reg = multiRegistry()
    const eth = reg.get('tab-eth')!
    eth.setLadderDirection('sell')
    const r = eth.placeLadderOrder('order-left', ETH)
    expect(r.ok).toBe(true)
    const legs = eth.getPositions().filter((p) => p.symbol === 'ETHUSDT')
    expect(legs[0]!.side).toBe('SHORT')
    expect(legs[0]!.qty).toBeCloseTo(QTY, 6)
  })

  it('3. SOL 탭 MIT 주문 등록', () => {
    const reg = multiRegistry()
    const sol = reg.get('tab-sol')!
    const trigger = SOL + 5
    const id = sol.registerMit(trigger, 'LONG', 'MIT')
    const mit = sol.getPendingMitStop().find((o) => o.id === id)
    expect(mit?.symbol).toBe('SOLUSDT')
    expect(mit?.qty).toBeCloseTo(QTY, 6)
  })

  it('4. BTC 청산 시 ETH/SOL 영향 없음', () => {
    const reg = multiRegistry()
    const btc = reg.get('tab-btc')!
    const eth = reg.get('tab-eth')!
    const sol = reg.get('tab-sol')!

    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', BTC)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', ETH)
    sol.registerMit(SOL + 5, 'LONG', 'MIT')

    const ethBefore = eth.getPositions().length
    const solPendingBefore = sol.getPendingMitStop().length
    const posId = btc.getPositions()[0]!.positionId

    const cr = btc.closePosition(posId, 100)
    expect(cr.ok).toBe(true)
    expect(btc.getPositions().filter((p) => p.qty > 0)).toHaveLength(0)
    expect(eth.getPositions().length).toBe(ethBefore)
    expect(sol.getPendingMitStop().length).toBe(solPendingBefore)
  })

  it('5. ETH TP/SL 등록 후 BTC/SOL 영향 없음', () => {
    const reg = multiRegistry()
    const btc = reg.get('tab-btc')!
    const eth = reg.get('tab-eth')!
    const sol = reg.get('tab-sol')!

    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', BTC)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', ETH)
    sol.registerMit(SOL + 5, 'LONG', 'MIT')

    const ethPos = eth.getPositions()[0]!
    eth.setSelectedPositionId(ethPos.positionId)
    const pr = eth.registerAutoProtection(50, 50, 100)
    expect(pr.ok).toBe(true)

    const btcOrders = btc.getPendingOrders().length
    const solMit = sol.getPendingMitStop().length

    expect(
      eth.getPendingOrders().filter((o) => o.symbol === 'ETHUSDT').length,
    ).toBe(2)
    expect(btc.getPendingOrders().length).toBe(btcOrders)
    expect(sol.getPendingMitStop().length).toBe(solMit)
  })

  it('6. SOL MIT trigger 시 SOL만 체결', () => {
    const reg = multiRegistry()
    const btc = reg.get('tab-btc')!
    const eth = reg.get('tab-eth')!
    const sol = reg.get('tab-sol')!

    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', BTC)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', ETH)

    const trigger = SOL + 10
    sol.registerMit(trigger, 'LONG', 'MIT')
    const btcN = btc.getPositions().length
    const ethN = eth.getPositions().length

    sol.manualTick('SOLUSDT', trigger)

    expect(sol.getPositions().some((p) => p.symbol === 'SOLUSDT')).toBe(true)
    expect(btc.getPositions().length).toBe(btcN)
    expect(eth.getPositions().length).toBe(ethN)
  })

  it('7. 팝업 registry — 동일 tabId 세션 공유', () => {
    const main = new SessionRegistry()
    const popup = new SessionRegistry()

    const btcMain = main.getOrCreate('tab-btc', 'BTCUSDT')
    btcMain.setLadderDirection('buy')
    btcMain.placeLadderOrder('order-right', BTC)

    const btcPopup = popup.getOrCreate('tab-btc', 'BTCUSDT')
    expect(btcPopup.getPositions().length).toBe(1)

    btcPopup.setSharedOrderQty(0.08)
    main.reloadFromStorage('tab-btc')
    expect(main.getOrCreate('tab-btc', 'BTCUSDT').getState().sharedOrderQty).toBe(
      0.08,
    )
  })

  it('8. floating — 동일 세션 참조 유지', () => {
    const reg = multiRegistry()
    const sol = reg.get('tab-sol')!
    const ref = sol
    sol.registerMit(SOL + 3, 'LONG', 'MIT')
    expect(reg.get('tab-sol')).toBe(ref)
    expect(reg.get('tab-sol')!.getPendingMitStop().length).toBe(1)
  })

  it('9. workspace 저장/불러오기 후 탭·포지션·주문 유지', () => {
    const reg = multiRegistry()
    const btc = reg.get('tab-btc')!
    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', BTC)

    const ws = createDefaultWorkspace('multi-coin')
    saveWorkspace(ws)

    const reg2 = new SessionRegistry()
    for (const tab of ws.tabs) {
      reg2.getOrCreate(tab.id, tab.symbol)
      reg2.reloadFromStorage(tab.id)
    }

    const btc2 = reg2.get('tab-btc')!
    expect(btc2.getState().symbol).toBe('BTCUSDT')
    expect(btc2.getPositions().some((p) => p.side === 'LONG')).toBe(true)
    expect(loadTabSession('tab-btc')?.symbol).toBe('BTCUSDT')
  })

  it('10. BroadcastChannel reload — 중복 체결 없음', () => {
    const reg = multiRegistry()
    const sol = reg.get('tab-sol')!
    const trigger = SOL + 10
    sol.registerMit(trigger, 'LONG', 'MIT')
    sol.manualTick('SOLUSDT', trigger)
    const countAfterTrigger = sol.getPositions().length
    expect(countAfterTrigger).toBe(1)

    const snap = loadTabSession('tab-sol')
    expect(snap?.orders.some((o) => o.status === 'filled')).toBe(true)

    const regB = new SessionRegistry()
    const solB = regB.getOrCreate('tab-sol', 'SOLUSDT')
    expect(solB.getPositions().length).toBe(countAfterTrigger)

    regB.reloadFromStorage('tab-sol')
    expect(regB.get('tab-sol')!.getPositions().length).toBe(countAfterTrigger)

    const msg = {
      type: 'session:saved' as const,
      tabId: 'tab-sol',
      source: 'other-window',
    }
    expect(isForeignSessionMessage(msg)).toBe(true)
  })
})
