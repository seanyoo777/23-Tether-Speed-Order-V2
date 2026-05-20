import { describe, expect, it } from 'vitest'
import { canRegisterBookMit } from '../integration/ladderMitBridge.ts'
import { getCoreSpec } from '../integration/symbolConfigBridge.ts'
import { watchlistRowsForProduct } from '../integration/watchlistBridge.ts'
import { createTradingSession } from '../engine/tradingSession.ts'
import {
  isKoreaDomesticOptionSymbol,
  KOREA_DOMESTIC_OPTION_SYMBOLS,
  KOREA_FUTURE_CONTRACT_SYMBOLS,
  KOREA_FUTURES_SYMBOL_CONFIG,
  PRODUCT_TAB_ORDER,
  symbolsForProduct,
} from '../types/productTypes.ts'

describe('P6 / KOREA_FUTURES — 선물 종목군 + 국내 옵션', () => {
  it('five product tabs (옵션은 국내선물 안)', () => {
    expect(PRODUCT_TAB_ORDER).toHaveLength(5)
    expect(PRODUCT_TAB_ORDER).not.toContain('COIN_OPTIONS' as never)
  })

  it('includes futures contracts and domestic options', () => {
    const syms = symbolsForProduct('KOREA_FUTURES')
    for (const f of KOREA_FUTURE_CONTRACT_SYMBOLS) {
      expect(syms).toContain(f)
    }
    for (const o of KOREA_DOMESTIC_OPTION_SYMBOLS) {
      expect(syms).toContain(o)
      expect(isKoreaDomesticOptionSymbol(o)).toBe(true)
    }
    expect(syms).toHaveLength(7)
  })

  it('watchlist lists futures + options under KOREA_FUTURES', () => {
    const rows = watchlistRowsForProduct('KOREA_FUTURES')
    expect(rows.some((r) => r.symbol === 'K200W' && r.tag === 'OPT')).toBe(true)
    expect(rows.some((r) => r.symbol === 'KOSPI200F' && r.tag === 'FUT')).toBe(
      true,
    )
  })

  it('weekly option K200W — panel + MIT', () => {
    const s = createTradingSession()
    s.setProduct('KOREA_FUTURES')
    s.setSymbol('K200W')
    expect(getCoreSpec('KOREA_FUTURES', 'K200W')?.marketType).toBe('option')
    expect(canRegisterBookMit('KOREA_FUTURES', 'K200W')).toBe(true)
    expect(s.placePanelOrder('buy').ok).toBe(true)
    const trigger = KOREA_FUTURES_SYMBOL_CONFIG.K200W.basePrice + 0.2
    s.registerMit(trigger, 'LONG', 'MIT')
    s.manualTick('K200W', trigger)
    expect(s.getLastTrigger()?.kind).toBe('MIT')
  })

  it('monthly option K200M and future KOSPI200FM share one-way engine', () => {
    const opt = createTradingSession()
    opt.setProduct('KOREA_FUTURES')
    opt.setSymbol('K200M')
    expect(opt.placePanelOrder('buy').ok).toBe(true)

    const fut = createTradingSession()
    fut.setProduct('KOREA_FUTURES')
    fut.setSymbol('KOSPI200FM')
    expect(getCoreSpec('KOREA_FUTURES', 'KOSPI200FM')?.marketType).toBe(
      'kr_future',
    )
    fut.setSharedOrderQty(1)
    expect(fut.placePanelOrder('buy').ok).toBe(true)
  })
})
