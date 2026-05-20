import type { DetachedOrderWindow } from './types.ts'
import { DETACHED_WINDOWS_STORAGE_KEY } from './types.ts'

export function saveDetachedWindows(rows: DetachedOrderWindow[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(DETACHED_WINDOWS_STORAGE_KEY, JSON.stringify(rows))
}

export function loadDetachedWindows(): DetachedOrderWindow[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(DETACHED_WINDOWS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DetachedOrderWindow[]
    return parsed.filter((r) => r.mockOnly === true)
  } catch {
    return []
  }
}

export function detachedWindowContract(): {
  defaultMode: DetachedOrderWindow['mode']
  maxRecommended: number
} {
  return { defaultMode: 'in_app_float', maxRecommended: 10 }
}
