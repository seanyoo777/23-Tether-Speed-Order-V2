export type HtsPanelSlot =
  | 'watchlist'
  | 'chart'
  | 'orderbook'
  | 'orderPanel'
  | 'dock'

export type PanelResizeAxis = 'horizontal' | 'vertical'

export type PanelSizeFrac = {
  /** 0–1 fraction of parent */
  frac: number
  minPx: number
  maxPx?: number
}

export type HtsPanelLayout = {
  slot: HtsPanelSlot
  visible: boolean
  widthFrac?: PanelSizeFrac
  heightFrac?: PanelSizeFrac
}

export type HtsLayoutSnapshot = {
  version: 1
  panels: Record<HtsPanelSlot, HtsPanelLayout>
  browserZoomPct: 100 | 110 | 120
  densityToken: 'compact' | 'normal' | 'comfort'
  savedAt: number
}

export const HTS_LAYOUT_STORAGE_KEY = 'tether23.hts.layout.core.v1'
