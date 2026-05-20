export type { DockTabId, DockSplitMode, DockLayoutSnapshot } from './types.ts'
export { DOCK_TAB_ORDER, DOCK_LAYOUT_STORAGE_KEY } from './types.ts'
export {
  defaultDockLayout,
  setDockSplit,
  setDockHeight,
  setActiveDockTab,
  saveDockLayout,
  loadDockLayout,
} from './dockLayout.ts'
