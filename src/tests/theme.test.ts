import { beforeEach, describe, expect, it } from 'vitest'
import { loadThemeId, saveThemeId, clearThemeStorage } from '../theme/themeStorage.ts'
import {
  createTheme2Workspace,
  theme2DefaultPanels,
} from '../theme/theme2Presets.ts'
import {
  clearWorkspaceStorage,
  loadWorkspace,
  saveWorkspace,
  workspaceStorageKey,
} from '../workspace/storage.ts'
import { WORKSPACE_STORAGE_THEME1, WORKSPACE_STORAGE_THEME2 } from '../workspace/types.ts'

describe('theme / persistence', () => {
  beforeEach(() => {
    clearThemeStorage()
    clearWorkspaceStorage()
  })

  it('saves and loads theme id', () => {
    saveThemeId('theme2')
    expect(loadThemeId()).toBe('theme2')
  })

  it('theme1 and theme2 use separate workspace keys', () => {
    expect(workspaceStorageKey('theme1')).toBe(WORKSPACE_STORAGE_THEME1)
    expect(workspaceStorageKey('theme2')).toBe(WORKSPACE_STORAGE_THEME2)
  })

  it('theme2 workspace defaults to floating panels', () => {
    const ws = createTheme2Workspace('theme2-ultra')
    expect(ws.panels.ladder.detached).toBe(true)
    expect(ws.panels.ladder.placement.zone).toBe('float')
  })

  it('theme2 multi-chart shows chart panels', () => {
    const panels = theme2DefaultPanels('theme2-multi-chart')
    expect(panels.chart1.visible).toBe(true)
    expect(panels.chart2.visible).toBe(true)
  })

  it('workspace save is isolated per theme', () => {
    const t1 = loadWorkspace('theme1')
    const t2 = createTheme2Workspace()
    saveWorkspace(t1, 'theme1')
    saveWorkspace(t2, 'theme2')
    expect(loadWorkspace('theme1').layoutPreset).not.toMatch(/^theme2/)
    expect(loadWorkspace('theme2').layoutPreset).toMatch(/^theme2/)
  })
})
