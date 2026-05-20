import type { DepthVisualMode } from './types.ts'

export const VISUAL_DEPTH_PREFS_KEY = 'tether23.visual_depth_v1'

export type VisualDepthPrefs = {
  mode: DepthVisualMode
  enabled: boolean
}

const DEFAULTS: VisualDepthPrefs = {
  mode: 'normal',
  enabled: true,
}

const memory: { raw: string | null } = { raw: null }

function store(): Pick<Storage, 'getItem' | 'setItem'> {
  if (typeof localStorage !== 'undefined') return localStorage
  return {
    getItem: () => memory.raw,
    setItem: (_k, v) => {
      memory.raw = v
    },
  }
}

export function loadVisualDepthPrefs(): VisualDepthPrefs {
  try {
    const raw = store().getItem(VISUAL_DEPTH_PREFS_KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw) as Partial<VisualDepthPrefs>
    return {
      mode: p.mode ?? DEFAULTS.mode,
      enabled: p.enabled ?? DEFAULTS.enabled,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveVisualDepthPrefs(prefs: VisualDepthPrefs): void {
  store().setItem(VISUAL_DEPTH_PREFS_KEY, JSON.stringify(prefs))
}

export function clearVisualDepthPrefs(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(VISUAL_DEPTH_PREFS_KEY)
  }
  memory.raw = null
}

export function cycleDepthMode(mode: DepthVisualMode): DepthVisualMode {
  if (mode === 'normal') return 'volatile'
  if (mode === 'volatile') return 'ultra-dom'
  return 'normal'
}
