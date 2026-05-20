export type {
  DetachedOrderWindow,
  DetachedWindowMode,
  OrderWindowPreset,
} from './types.ts'
export { DETACHED_WINDOWS_STORAGE_KEY } from './types.ts'
export { createDetachedWindowRegistry, type DetachedWindowRegistry } from './registry.ts'
export {
  saveDetachedWindows,
  loadDetachedWindows,
  detachedWindowContract,
} from './persistence.ts'
