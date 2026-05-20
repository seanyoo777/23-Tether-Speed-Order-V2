import type { HtsLayoutSnapshot } from './types.ts'
import { HTS_LAYOUT_STORAGE_KEY } from './types.ts'

export function defaultHtsLayout(): HtsLayoutSnapshot {
  const panel = (slot: HtsLayoutSnapshot['panels'][keyof HtsLayoutSnapshot['panels']]['slot']) => ({
    slot,
    visible: true,
    widthFrac: { frac: 0.2, minPx: 160 },
    heightFrac: { frac: 1, minPx: 200 },
  })
  return {
    version: 1,
    panels: {
      watchlist: { ...panel('watchlist'), widthFrac: { frac: 0.18, minPx: 140 } },
      chart: { ...panel('chart'), widthFrac: { frac: 0.42, minPx: 280 } },
      orderbook: { ...panel('orderbook'), widthFrac: { frac: 0.22, minPx: 200 } },
      orderPanel: { ...panel('orderPanel'), widthFrac: { frac: 0.18, minPx: 160 } },
      dock: {
        slot: 'dock',
        visible: true,
        heightFrac: { frac: 0.28, minPx: 120, maxPx: 480 },
      },
    },
    browserZoomPct: 100,
    densityToken: 'normal',
    savedAt: Date.now(),
  }
}

export function saveHtsLayout(snapshot: HtsLayoutSnapshot): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(HTS_LAYOUT_STORAGE_KEY, JSON.stringify(snapshot))
}

export function loadHtsLayout(): HtsLayoutSnapshot | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(HTS_LAYOUT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as HtsLayoutSnapshot
    if (parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

/** Layout uses font-size density — not CSS transform scale (zoom-safe). */
export function layoutPersistenceContract(): { zoomSafe: boolean; storageKey: string } {
  return { zoomSafe: true, storageKey: HTS_LAYOUT_STORAGE_KEY }
}
