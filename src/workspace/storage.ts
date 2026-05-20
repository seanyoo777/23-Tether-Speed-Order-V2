import type { ThemeId } from '../theme/types.ts'
import type { WorkspaceSnapshot } from './types.ts'
import {
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_STORAGE_THEME1,
  WORKSPACE_STORAGE_THEME2,
} from './types.ts'
import { createDefaultWorkspace } from './presets.ts'
import { createTheme2Workspace } from '../theme/theme2Presets.ts'

const memoryStore: Record<string, string> = {}

function store(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  if (typeof localStorage !== 'undefined') return localStorage
  return {
    getItem: (k) => memoryStore[k] ?? null,
    setItem: (k, v) => {
      memoryStore[k] = v
    },
    removeItem: (k) => {
      delete memoryStore[k]
    },
  }
}

export function workspaceStorageKey(themeId: ThemeId): string {
  return themeId === 'theme2' ? WORKSPACE_STORAGE_THEME2 : WORKSPACE_STORAGE_THEME1
}

function migrateLegacyTheme1(): void {
  const legacy = store().getItem(WORKSPACE_STORAGE_KEY)
  if (legacy && !store().getItem(WORKSPACE_STORAGE_THEME1)) {
    store().setItem(WORKSPACE_STORAGE_THEME1, legacy)
  }
}

export function loadWorkspace(themeId: ThemeId = 'theme1'): WorkspaceSnapshot {
  migrateLegacyTheme1()
  const key = workspaceStorageKey(themeId)
  const fallback = () =>
    themeId === 'theme2' ? createTheme2Workspace() : createDefaultWorkspace()

  try {
    const raw = store().getItem(key)
    if (!raw) return fallback()
    const parsed = JSON.parse(raw) as WorkspaceSnapshot
    if (parsed.version !== 1 || !parsed.tabs?.length) {
      return fallback()
    }
    return parsed
  } catch {
    return fallback()
  }
}

export function saveWorkspace(
  snap: WorkspaceSnapshot,
  themeId: ThemeId = 'theme1',
): WorkspaceSnapshot {
  const next = { ...snap, savedAt: Date.now() }
  store().setItem(workspaceStorageKey(themeId), JSON.stringify(next))
  return next
}

export function clearWorkspaceStorage(themeId?: ThemeId): void {
  if (themeId) {
    store().removeItem(workspaceStorageKey(themeId))
    return
  }
  store().removeItem(WORKSPACE_STORAGE_KEY)
  store().removeItem(WORKSPACE_STORAGE_THEME1)
  store().removeItem(WORKSPACE_STORAGE_THEME2)
  for (const k of Object.keys(memoryStore)) {
    if (k.includes('workspace')) delete memoryStore[k]
  }
}
