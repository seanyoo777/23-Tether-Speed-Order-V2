import { tagMockOnly } from '../contracts/mockOnly.ts'
import type { CoreMarketType } from '../symbolSpec/types.ts'
import type { DetachedOrderWindow, OrderWindowPreset } from './types.ts'

const DEFAULT_PRESET: OrderWindowPreset = {
  qty: 0.05,
  orderType: 'limit',
  oneClick: true,
}

export function createDetachedWindowRegistry() {
  const windows = new Map<string, DetachedOrderWindow>()

  function open(input: {
    symbol: string
    marketType: CoreMarketType
    linkedWorkspaceId: string
    position?: { x: number; y: number }
    size?: { w: number; h: number }
  }): DetachedOrderWindow {
    const windowId = `win-${Date.now().toString(36)}`
    const row = tagMockOnly({
      windowId,
      symbol: input.symbol,
      marketType: input.marketType,
      qtyPreset: { ...DEFAULT_PRESET },
      orderPreset: { ...DEFAULT_PRESET },
      position: input.position ?? { x: 80, y: 80 },
      size: input.size ?? { w: 420, h: 640 },
      linkedWorkspaceId: input.linkedWorkspaceId,
      mode: 'in_app_float' as const,
      zIndex: 40 + windows.size,
    })
    windows.set(windowId, row)
    return row
  }

  function list(): DetachedOrderWindow[] {
    return [...windows.values()]
  }

  function get(windowId: string): DetachedOrderWindow | undefined {
    return windows.get(windowId)
  }

  function close(windowId: string): boolean {
    return windows.delete(windowId)
  }

  return { open, list, get, close }
}

export type DetachedWindowRegistry = ReturnType<typeof createDetachedWindowRegistry>
