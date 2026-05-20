import { beforeEach, describe, expect, it } from 'vitest'
import { COIN_SYMBOL_CONFIG, DEFAULT_SHARED_ORDER_QTY } from '../types/productTypes.ts'
import { createTheme2Workspace, theme2DefaultTabs } from '../theme/theme2Presets.ts'
import { loadThemeId, saveThemeId, clearThemeStorage } from '../theme/themeStorage.ts'
import { SessionRegistry } from '../workspace/sessionRegistry.ts'
import {
  clearSessionStorage,
  loadTabSession,
} from '../workspace/sessionPersistence.ts'
import {
  clearWorkspaceStorage,
  loadWorkspace,
  saveWorkspace,
  workspaceStorageKey,
} from '../workspace/storage.ts'
import { createDefaultWorkspace } from '../workspace/presets.ts'
import { WORKSPACE_STORAGE_THEME1, WORKSPACE_STORAGE_THEME2 } from '../workspace/types.ts'

const QTY = DEFAULT_SHARED_ORDER_QTY
const BTC = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice
const ETH = COIN_SYMBOL_CONFIG.ETHUSDT.basePrice
const SOL = COIN_SYMBOL_CONFIG.SOLUSDT.basePrice

/** Simulates WorkspaceProvider remount on theme switch (new SessionRegistry). */
function remountRegistry(
  tabs: { id: string; symbol: 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' }[],
): SessionRegistry {
  const reg = new SessionRegistry()
  for (const tab of tabs) {
    reg.getOrCreate(tab.id, tab.symbol)
  }
  return reg
}

function theme2MultiRegistry(): SessionRegistry {
  const reg = new SessionRegistry()
  for (const tab of theme2DefaultTabs()) {
    reg.getOrCreate(tab.id, tab.symbol)
  }
  return reg
}

describe('THEME2_ORDER_ACCURACY_QA', () => {
  beforeEach(() => {
    clearSessionStorage()
    clearWorkspaceStorage()
    clearThemeStorage()
  })

  it('1. THEME2 — BTC 탭 LONG 0.05 진입', () => {
    const reg = theme2MultiRegistry()
    const btc = reg.get('tab-btc')!
    btc.setLadderDirection('buy')
    const r = btc.placeLadderOrder('order-right', BTC)
    expect(r.ok).toBe(true)
    const legs = btc.getPositions().filter((p) => p.symbol === 'BTCUSDT')
    expect(legs).toHaveLength(1)
    expect(legs[0]!.side).toBe('LONG')
    expect(legs[0]!.qty).toBeCloseTo(QTY, 6)
    expect(loadTabSession('tab-btc')?.symbol).toBe('BTCUSDT')
  })

  it('2. THEME2 — ETH 탭 SHORT 0.05 진입', () => {
    const reg = theme2MultiRegistry()
    const eth = reg.get('tab-eth')!
    eth.setLadderDirection('sell')
    const r = eth.placeLadderOrder('order-left', ETH)
    expect(r.ok).toBe(true)
    const legs = eth.getPositions().filter((p) => p.symbol === 'ETHUSDT')
    expect(legs[0]!.side).toBe('SHORT')
    expect(legs[0]!.qty).toBeCloseTo(QTY, 6)
  })

  it('3. THEME1↔THEME2 전환 후 포지션 유지 (shared session storage)', () => {
    const regT2 = theme2MultiRegistry()
    regT2.get('tab-btc')!.setLadderDirection('buy')
    regT2.get('tab-btc')!.placeLadderOrder('order-right', BTC)
    regT2.get('tab-eth')!.setLadderDirection('sell')
    regT2.get('tab-eth')!.placeLadderOrder('order-left', ETH)

    saveThemeId('theme1')
    const regT1 = remountRegistry([{ id: 'tab-btc', symbol: 'BTCUSDT' }])
    expect(
      regT1.get('tab-btc')!.getPositions().some((p) => p.side === 'LONG'),
    ).toBe(true)

    saveThemeId('theme2')
    const regT2b = remountRegistry(theme2DefaultTabs())
    expect(
      regT2b.get('tab-btc')!.getPositions().some((p) => p.side === 'LONG'),
    ).toBe(true)
    expect(
      regT2b.get('tab-eth')!.getPositions().some((p) => p.side === 'SHORT'),
    ).toBe(true)
    expect(loadThemeId()).toBe('theme2')
  })

  it('4. theme1 / theme2 workspace storage 분리', () => {
    const t1 = createDefaultWorkspace('multi-coin')
    const t2 = createTheme2Workspace('theme2-ultra')
    saveWorkspace(t1, 'theme1')
    saveWorkspace(t2, 'theme2')
    expect(workspaceStorageKey('theme1')).toBe(WORKSPACE_STORAGE_THEME1)
    expect(workspaceStorageKey('theme2')).toBe(WORKSPACE_STORAGE_THEME2)
    expect(loadWorkspace('theme1').layoutPreset).toBe('multi-coin')
    expect(loadWorkspace('theme2').layoutPreset).toMatch(/^theme2/)
    expect(loadWorkspace('theme1').panels.ladder.detached).not.toBe(
      loadWorkspace('theme2').panels.ladder.detached,
    )
  })

  it('5. floating ladder 주문 — 해당 tab/session 만 변경', () => {
    const reg = theme2MultiRegistry()
    const btc = reg.get('tab-btc')!
    const eth = reg.get('tab-eth')!
    const sol = reg.get('tab-sol')!
    const solRef = sol

    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', BTC)

    const ethBefore = eth.getPositions().length
    const solMitBefore = sol.getPendingMitStop().length

    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', ETH)

    expect(btc.getPositions().filter((p) => p.qty > 0)).toHaveLength(1)
    expect(eth.getPositions().length).toBe(ethBefore + 1)
    expect(sol.getPendingMitStop().length).toBe(solMitBefore)
    expect(reg.get('tab-sol')).toBe(solRef)
  })

  it('6. theme2-multi-chart preset — 탭별 주문 세션 미혼합', () => {
    const ws = createTheme2Workspace('theme2-multi-chart')
    expect(ws.panels.chart1.visible).toBe(true)

    const reg = new SessionRegistry()
    for (const tab of ws.tabs) {
      reg.getOrCreate(tab.id, tab.symbol)
    }

    const btc = reg.get('tab-btc')!
    const eth = reg.get('tab-eth')!
    const sol = reg.get('tab-sol')!

    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', BTC)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', ETH)
    sol.registerMit(SOL + 8, 'LONG', 'MIT')

    sol.manualTick('SOLUSDT', SOL + 8)

    expect(btc.getPositions().every((p) => p.symbol === 'BTCUSDT')).toBe(true)
    expect(eth.getPositions().every((p) => p.symbol === 'ETHUSDT')).toBe(true)
    expect(sol.getPositions().some((p) => p.symbol === 'SOLUSDT')).toBe(true)
    expect(btc.getPositions().length).toBe(1)
    expect(eth.getPositions().length).toBe(1)
  })

  it('7. theme 전환 remount + reload — 중복 체결 없음', () => {
    const reg = theme2MultiRegistry()
    const sol = reg.get('tab-sol')!
    const trigger = SOL + 10
    sol.registerMit(trigger, 'LONG', 'MIT')
    sol.manualTick('SOLUSDT', trigger)
    const countAfter = sol.getPositions().length
    expect(countAfter).toBe(1)

    saveThemeId('theme1')
    const regT1 = remountRegistry(theme2DefaultTabs())
    const solT1 = regT1.get('tab-sol')!
    expect(solT1.getPositions().length).toBe(countAfter)
    regT1.reloadFromStorage('tab-sol')
    expect(regT1.get('tab-sol')!.getPositions().length).toBe(countAfter)

    saveThemeId('theme2')
    const regT2 = remountRegistry(theme2DefaultTabs())
    regT2.reloadFromStorage('tab-sol')
    expect(regT2.get('tab-sol')!.getPositions().length).toBe(countAfter)
    const filled = loadTabSession('tab-sol')?.orders.filter(
      (o) => o.status === 'filled',
    )
    expect(filled?.length).toBeGreaterThanOrEqual(1)
  })

  it('8. THEME1 기존 multi-coin 동작 유지', () => {
    const reg = new SessionRegistry()
    reg.getOrCreate('tab-btc', 'BTCUSDT')
    reg.getOrCreate('tab-eth', 'ETHUSDT')

    const btc = reg.get('tab-btc')!
    const eth = reg.get('tab-eth')!
    btc.setLadderDirection('buy')
    btc.placeLadderOrder('order-right', BTC)
    eth.setLadderDirection('sell')
    eth.placeLadderOrder('order-left', ETH)

    const ws = createDefaultWorkspace('multi-coin')
    saveWorkspace(ws, 'theme1')
    expect(loadWorkspace('theme1').tabs).toHaveLength(3)

    btc.closePosition(btc.getPositions()[0]!.positionId, 100)
    expect(btc.getPositions().filter((p) => p.qty > 0)).toHaveLength(0)
    expect(eth.getPositions().filter((p) => p.qty > 0)).toHaveLength(1)
  })
})
