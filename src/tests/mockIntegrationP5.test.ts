import { beforeEach, describe, expect, it } from 'vitest'
import { allEngineTickerSymbols } from '../integration/symbolConfigBridge.ts'
import { createTradingSession } from '../engine/tradingSession.ts'
import {
  createDefaultWorkspace,
  defaultTabs,
} from '../workspace/presets.ts'
import { buildPopupUrl, parsePopupSearch } from '../workspace/popupBridge.ts'
import {
  clearWorkspaceStorage,
  loadWorkspace,
  saveWorkspace,
} from '../workspace/storage.ts'
import { createTheme2Workspace } from '../theme/theme2Presets.ts'
import { clearThemeStorage, loadThemeId, saveThemeId } from '../theme/themeStorage.ts'
import { WORKSPACE_STORAGE_THEME1, WORKSPACE_STORAGE_THEME2 } from '../workspace/types.ts'
import {
  COIN_SYMBOL_CONFIG,
  defaultSymbolForProduct,
  isProductEngineReady,
  KOREA_STOCK_SYMBOL_CONFIG,
  OVERSEAS_SYMBOL_CONFIG,
  US_STOCK_SYMBOL_CONFIG,
  type ProductType,
} from '../types/productTypes.ts'

const PRODUCT_CYCLE: ProductType[] = [
  'COIN_FUTURES',
  'OVERSEAS_FUTURES',
  'US_STOCK',
  'KOREA_STOCK',
]

const BTC = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice

function panelBuyOk(s: ReturnType<typeof createTradingSession>): boolean {
  s.setOrderEntryKind('market')
  return s.placePanelOrder('buy').ok
}

describe('P5 / four-product integration', () => {
  it('all four products engine-ready', () => {
    for (const p of PRODUCT_CYCLE) {
      expect(isProductEngineReady(p)).toBe(true)
      expect(defaultSymbolForProduct(p)).toBeTruthy()
    }
    const symbols = allEngineTickerSymbols()
    expect(symbols).toContain('BTCUSDT')
    expect(symbols).toContain('ESZ6')
    expect(symbols).toContain('AAPL')
    expect(symbols).toContain('005930')
  })

  it('COIN → OVERSEAS → US → KR — panel buy + one-way + default symbol', () => {
    const s = createTradingSession()
    s.setProduct('COIN_FUTURES')
    expect(s.getState().symbol).toBe('BTCUSDT')
    expect(panelBuyOk(s)).toBe(true)

    s.setProduct('OVERSEAS_FUTURES')
    expect(s.getState().symbol).toBe('ESZ6')
    expect(s.getState().hedgeMode).toBe(false)
    expect(panelBuyOk(s)).toBe(true)

    s.setProduct('US_STOCK')
    expect(s.getState().symbol).toBe('AAPL')
    expect(panelBuyOk(s)).toBe(true)

    s.setProduct('KOREA_STOCK')
    expect(s.getState().symbol).toBe('005930')
    expect(panelBuyOk(s)).toBe(true)
  })

  it('reverse cycle KR → US → OVERSEAS → COIN restores coin hedge toggle', () => {
    const s = createTradingSession()
    s.setProduct('KOREA_STOCK')
    s.setHedgeMode(true)
    expect(s.getState().hedgeMode).toBe(false)

    s.setProduct('COIN_FUTURES')
    s.setHedgeMode(true)
    expect(s.getState().hedgeMode).toBe(true)
    s.setProduct('OVERSEAS_FUTURES')
    expect(s.getState().hedgeMode).toBe(false)
    s.setProduct('COIN_FUTURES')
    expect(s.getState().symbol).toBe('BTCUSDT')
  })

  it('ladder order per product (one-way)', () => {
    const s = createTradingSession()
    const prices = {
      COIN_FUTURES: BTC,
      OVERSEAS_FUTURES: OVERSEAS_SYMBOL_CONFIG.ESZ6.basePrice,
      US_STOCK: US_STOCK_SYMBOL_CONFIG.AAPL.basePrice,
      KOREA_STOCK: KOREA_STOCK_SYMBOL_CONFIG['005930'].basePrice,
    } as const

    for (const p of PRODUCT_CYCLE) {
      s.setProduct(p)
      const r = s.placeLadderOrder('order-right', prices[p])
      expect(r.ok).toBe(true)
    }
    expect(s.getPositions().length).toBeGreaterThanOrEqual(4)
  })

  it('coin MIT/STOP still triggers after full product cycle', () => {
    const s = createTradingSession()
    for (const p of PRODUCT_CYCLE) {
      if (p !== 'COIN_FUTURES') s.setProduct(p)
    }
    s.setProduct('COIN_FUTURES')
    const trigger = BTC + 40
    s.registerMit(trigger, 'LONG', 'MIT')
    s.manualTick('BTCUSDT', trigger)
    expect(s.getLastTrigger()?.kind).toBe('MIT')
  })
})

describe('P5 / theme · workspace · popup', () => {
  beforeEach(() => {
    clearWorkspaceStorage()
    clearThemeStorage()
  })

  it('Theme1 default vs Theme2 detached ladder', () => {
    const t1 = createDefaultWorkspace('default')
    const t2 = createTheme2Workspace()
    expect(t1.panels.ladder.detached).not.toBe(true)
    expect(t2.panels.ladder.detached).toBe(true)
  })

  it('floating-ladder preset — detached + float zone', () => {
    const ws = createDefaultWorkspace('floating-ladder')
    expect(ws.panels.ladder.detached).toBe(true)
    expect(ws.panels.ladder.placement.zone).toBe('float')
  })

  it('popup URL parse and build', () => {
    const p = parsePopupSearch('?popup=1&tabId=tab-eth&panel=ladder')
    expect(p.popup).toBe(true)
    expect(p.tabId).toBe('tab-eth')
    expect(p.panel).toBe('ladder')
    expect(buildPopupUrl('tab-btc', 'ladder')).toContain('popup=1')
  })

  it('theme1 / theme2 workspace storage roundtrip', () => {
    const snap = createDefaultWorkspace('multi-coin')
    saveWorkspace(snap, WORKSPACE_STORAGE_THEME1)
    saveWorkspace(createTheme2Workspace(), WORKSPACE_STORAGE_THEME2)
    expect(loadWorkspace(WORKSPACE_STORAGE_THEME1).tabs.length).toBe(
      defaultTabs('multi-coin').length,
    )
    expect(loadWorkspace(WORKSPACE_STORAGE_THEME2).panels.chart1).toBeDefined()
  })

  it('theme id persistence', () => {
    saveThemeId('theme2')
    expect(loadThemeId()).toBe('theme2')
  })
})
