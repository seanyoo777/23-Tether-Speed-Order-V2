import type { DockLayoutSnapshot, DockSplitMode, DockTabId } from './types.ts'
import { DOCK_LAYOUT_STORAGE_KEY } from './types.ts'

export function defaultDockLayout(): DockLayoutSnapshot {
  return {
    version: 1,
    activeTab: 'position',
    split: 'single',
    heightFrac: 0.28,
    innerScroll: true,
    minimizePageScroll: true,
  }
}

export function setDockSplit(
  snapshot: DockLayoutSnapshot,
  split: DockSplitMode,
): DockLayoutSnapshot {
  return { ...snapshot, split }
}

export function setDockHeight(
  snapshot: DockLayoutSnapshot,
  heightFrac: number,
): DockLayoutSnapshot {
  return {
    ...snapshot,
    heightFrac: Math.max(0.12, Math.min(0.55, heightFrac)),
  }
}

export function setActiveDockTab(
  snapshot: DockLayoutSnapshot,
  activeTab: DockTabId,
): DockLayoutSnapshot {
  return { ...snapshot, activeTab }
}

export function saveDockLayout(snapshot: DockLayoutSnapshot): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(DOCK_LAYOUT_STORAGE_KEY, JSON.stringify(snapshot))
}

export function loadDockLayout(): DockLayoutSnapshot | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(DOCK_LAYOUT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DockLayoutSnapshot
  } catch {
    return null
  }
}
