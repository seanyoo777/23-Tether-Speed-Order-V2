import type { MockOnlyTagged } from '../contracts/mockOnly.ts'
import type { CoreMarketType } from '../symbolSpec/types.ts'

export type DetachedWindowMode = 'in_app_float' | 'browser_popup'

export type OrderWindowPreset = {
  qty: number
  orderType: 'market' | 'limit'
  oneClick: boolean
}

export type DetachedOrderWindow = {
  windowId: string
  symbol: string
  marketType: CoreMarketType
  qtyPreset: OrderWindowPreset
  orderPreset: OrderWindowPreset
  position: { x: number; y: number }
  size: { w: number; h: number }
  linkedWorkspaceId: string
  mode: DetachedWindowMode
  zIndex: number
} & MockOnlyTagged

export const DETACHED_WINDOWS_STORAGE_KEY = 'tether23.detached.windows.v1'
