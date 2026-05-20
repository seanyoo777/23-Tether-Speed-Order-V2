import { beforeEach, describe, expect, it } from 'vitest'
import { buildDepthBookVisual, isIcebergMock } from '../visualDepth/depthEngine.ts'
import {
  clearVisualDepthPrefs,
  cycleDepthMode,
  loadVisualDepthPrefs,
  saveVisualDepthPrefs,
} from '../visualDepth/visualDepthPrefs.ts'

describe('PHASE_VISUAL_DEPTH_ENGINE', () => {
  beforeEach(() => {
    clearVisualDepthPrefs()
  })

  it('builds heatmap pressure and cumulative bars', () => {
    const rows = [
      { index: 14, price: 97_425, isCurrent: false },
      { index: 15, price: 97_420, isCurrent: true },
      { index: 16, price: 97_415, isCurrent: false },
    ]
    const book = buildDepthBookVisual({
      symbol: 'BTCUSDT',
      lastPrice: 97_420,
      tick: 0.5,
      rows,
      midIndex: 1,
      tickDirection: 'up',
      version: 5,
      mode: 'normal',
    })
    const ask = book.rows.get(14)
    const bid = book.rows.get(16)
    expect(ask?.askQty).toBeGreaterThan(0)
    expect(bid?.bidQty).toBeGreaterThan(0)
    expect(ask?.askPressure).toBeGreaterThanOrEqual(0)
    expect(bid?.bidCumPct).toBeGreaterThan(0)
  })

  it('volatile mode enables panic', () => {
    const rows = [{ index: 15, price: 97_420, isCurrent: true }]
    const book = buildDepthBookVisual({
      symbol: 'BTCUSDT',
      lastPrice: 97_420,
      tick: 0.5,
      rows,
      midIndex: 0,
      tickDirection: 'down',
      version: 99,
      mode: 'volatile',
    })
    expect(book.panicMode).toBe(true)
    expect(book.aggressiveSide).toBe('sell')
  })

  it('iceberg mock is deterministic', () => {
    const a = isIcebergMock('BTCUSDT', 97_420, 'ask', 0.5)
    const b = isIcebergMock('BTCUSDT', 97_420, 'ask', 0.5)
    expect(a).toBe(b)
  })

  it('prefs cycle and persist', () => {
    saveVisualDepthPrefs({ mode: 'normal', enabled: true })
    expect(cycleDepthMode('normal')).toBe('volatile')
    expect(loadVisualDepthPrefs().enabled).toBe(true)
  })
})
