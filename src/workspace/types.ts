import type { CoinSymbol } from '../types/productTypes.ts'

export type PanelId =
  | 'tape'
  | 'ladder'
  | 'order'
  | 'mit'
  | 'linkage'
  | 'dock'
  | 'status'
  | 'chart1'
  | 'chart2'
  | 'chart3'

export type DockZone = 'left' | 'center' | 'right' | 'bottom' | 'float'

export type LayoutPresetId =
  | 'default'
  | 'scalper'
  | 'multi-coin'
  | 'wide-ladder'
  | 'floating-ladder'
  | 'theme2-ultra'
  | 'theme2-multi-chart'

export type MonitorPresetId = 'single' | 'dual' | 'triple'

export type WorkspaceTab = {
  id: string
  symbol: CoinSymbol
  label: string
}

export type PanelPlacement = {
  zone: DockZone
  /** float panel position (px) */
  x: number
  y: number
  w: number
  h: number
}

export type PanelState = {
  id: PanelId
  visible: boolean
  detached: boolean
  popup: boolean
  placement: PanelPlacement
}

export type WorkspaceSnapshot = {
  version: 1
  activeTabId: string
  layoutPreset: LayoutPresetId
  monitorPreset: MonitorPresetId
  tabs: WorkspaceTab[]
  panels: Record<PanelId, PanelState>
  savedAt: number
}

export type PopupParams = {
  popup: boolean
  tabId: string
  panel: PanelId
}

/** @deprecated legacy — migrated to theme1 key */
export const WORKSPACE_STORAGE_KEY = 'tether23.workspace_v1'
export const WORKSPACE_STORAGE_THEME1 = 'tether23.workspace.theme1_v1'
export const WORKSPACE_STORAGE_THEME2 = 'tether23.workspace.theme2_v1'
export const WORKSPACE_CHANNEL = 'tether23-workspace-sync'
