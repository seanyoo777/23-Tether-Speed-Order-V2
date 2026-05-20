import { describe, expect, it, beforeEach } from 'vitest'
import {
  applyLayoutPreset,
  createDefaultWorkspace,
  defaultTabs,
} from '../workspace/presets.ts'
import { SessionRegistry } from '../workspace/sessionRegistry.ts'
import {
  clearWorkspaceStorage,
  loadWorkspace,
  saveWorkspace,
} from '../workspace/storage.ts'
import { buildPopupUrl, parsePopupSearch } from '../workspace/popupBridge.ts'

describe('workspace / presets', () => {
  it('multi-coin preset has BTC ETH SOL tabs', () => {
    const tabs = defaultTabs('multi-coin')
    expect(tabs.map((t) => t.symbol)).toEqual(['BTCUSDT', 'ETHUSDT', 'SOLUSDT'])
  })

  it('floating-ladder marks ladder detached', () => {
    const ws = createDefaultWorkspace('floating-ladder')
    expect(ws.panels.ladder.detached).toBe(true)
    expect(ws.panels.ladder.placement.zone).toBe('float')
  })

  it('applyLayoutPreset switches panels', () => {
    const base = createDefaultWorkspace('default')
    const wide = applyLayoutPreset(base, 'wide-ladder')
    expect(wide.panels.tape.visible).toBe(false)
    expect(wide.panels.order.visible).toBe(false)
  })
})

describe('workspace / storage', () => {
  beforeEach(() => {
    clearWorkspaceStorage()
  })

  it('save and load roundtrip', () => {
    const snap = createDefaultWorkspace('scalper')
    saveWorkspace(snap)
    const loaded = loadWorkspace()
    expect(loaded.layoutPreset).toBe('scalper')
    expect(loaded.tabs.length).toBeGreaterThan(0)
  })
})

describe('workspace / session registry', () => {
  it('isolates sessions per tab', () => {
    const reg = new SessionRegistry()
    const btc = reg.getOrCreate('tab-btc', 'BTCUSDT')
    const eth = reg.getOrCreate('tab-eth', 'ETHUSDT')
    expect(btc).not.toBe(eth)
    expect(btc.getState().symbol).toBe('BTCUSDT')
    expect(eth.getState().symbol).toBe('ETHUSDT')
  })
})

describe('workspace / popup url', () => {
  it('parses popup query', () => {
    const p = parsePopupSearch('?popup=1&tabId=tab-eth&panel=ladder')
    expect(p.popup).toBe(true)
    expect(p.tabId).toBe('tab-eth')
    expect(p.panel).toBe('ladder')
  })

  it('builds popup url', () => {
    expect(buildPopupUrl('tab-btc', 'ladder')).toContain('popup=1')
    expect(buildPopupUrl('tab-btc', 'ladder')).toContain('tab-btc')
  })
})
