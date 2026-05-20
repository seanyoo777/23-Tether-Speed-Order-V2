export type DockTabId =
  | 'position'
  | 'unfilled'
  | 'fills'
  | 'orders'
  | 'balance'
  | 'liquidation'
  | 'dailyPnl'
  | 'risk'

export const DOCK_TAB_ORDER: readonly DockTabId[] = [
  'position',
  'unfilled',
  'fills',
  'orders',
  'balance',
  'liquidation',
  'dailyPnl',
  'risk',
] as const

export type DockSplitMode = 'single' | 'split2' | 'split3'

export type DockLayoutSnapshot = {
  version: 1
  activeTab: DockTabId
  split: DockSplitMode
  heightFrac: number
  innerScroll: boolean
  minimizePageScroll: boolean
}

export const DOCK_LAYOUT_STORAGE_KEY = 'tether23.hts.dock.core.v1'
