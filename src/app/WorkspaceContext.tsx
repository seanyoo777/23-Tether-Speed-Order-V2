import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CoinSymbol } from '../types/productTypes.ts'
import { COIN_SYMBOLS } from '../types/productTypes.ts'
import { loadWorkflowPrefs } from '../proWorkflow/workflowPrefs.ts'
import type { ThemeId } from '../theme/types.ts'
import { applyTheme2LayoutPreset } from '../theme/theme2Presets.ts'
import { applyLayoutPreset } from '../workspace/presets.ts'
import {
  createSessionChannel,
  createWorkspaceChannel,
  isForeignSessionMessage,
  openWorkspacePopup,
  postSessionSaved,
  postWorkspaceUpdated,
  type SessionMessage,
  type WorkspaceMessage,
} from '../workspace/popupBridge.ts'
import { exportTabSession } from '../workspace/sessionSnapshot.ts'
import { saveTabSession } from '../workspace/sessionPersistence.ts'
import { SessionRegistry } from '../workspace/sessionRegistry.ts'
import { loadWorkspace, saveWorkspace } from '../workspace/storage.ts'
import type {
  DockZone,
  LayoutPresetId,
  MonitorPresetId,
  PanelId,
  PanelPlacement,
  PanelState,
  WorkspaceSnapshot,
  WorkspaceTab,
} from '../workspace/types.ts'

type WorkspaceApi = {
  snapshot: WorkspaceSnapshot
  registry: SessionRegistry
  activeTab: WorkspaceTab
  isPopup: boolean
  popupPanel: PanelId | null
  symbolSync: boolean
  workspaceAutoRestore: boolean
  compactTape: boolean
  setActiveTab: (tabId: string) => void
  addTab: (symbol: CoinSymbol) => void
  closeTab: (tabId: string) => void
  setLayoutPreset: (preset: LayoutPresetId) => void
  setMonitorPreset: (preset: MonitorPresetId) => void
  setWorkspaceSymbol: (symbol: CoinSymbol) => void
  setSymbolSync: (v: boolean) => void
  setWorkspaceAutoRestore: (v: boolean) => void
  setCompactTape: (v: boolean) => void
  save: () => void
  load: () => void
  detachPanel: (panelId: PanelId) => void
  dockPanel: (panelId: PanelId, zone?: DockZone) => void
  movePanel: (panelId: PanelId, placement: Partial<PanelPlacement>) => void
  openPopup: (panelId: PanelId, tabId?: string) => void
  panel: (id: PanelId) => PanelState
}

const Ctx = createContext<WorkspaceApi | null>(null)

function newTabId(): string {
  return `tab-${Date.now().toString(36)}`
}

export function WorkspaceProvider({
  children,
  themeId = 'theme1',
  popupMode = false,
  popupTabId,
  popupPanel,
}: {
  children: ReactNode
  themeId?: ThemeId
  popupMode?: boolean
  popupTabId?: string
  popupPanel?: PanelId
}) {
  const initialPrefs = loadWorkflowPrefs()
  const [symbolSync, setSymbolSyncState] = useState(initialPrefs.symbolSync)
  const [workspaceAutoRestore, setWorkspaceAutoRestoreState] = useState(
    initialPrefs.workspaceAutoRestore,
  )
  const [compactTape, setCompactTapeState] = useState(initialPrefs.compactTape)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(() => {
    const loaded = loadWorkspace(themeId)
    if (
      popupMode &&
      popupTabId &&
      loaded.tabs.some((t) => t.id === popupTabId)
    ) {
      return { ...loaded, activeTabId: popupTabId }
    }
    return loaded
  })
  const registry = useMemo(() => {
    const r = new SessionRegistry()
    return r
  }, [])
  const channelRef = useRef(createWorkspaceChannel())
  const sessionChannelRef = useRef(createSessionChannel())

  useEffect(() => {
    registry.setPersistListener((tabId) => {
      postSessionSaved(sessionChannelRef.current, tabId)
    })
  }, [registry])

  const activeTab =
    snapshot.tabs.find((t) => t.id === snapshot.activeTabId) ?? snapshot.tabs[0]!

  useEffect(() => {
    for (const tab of snapshot.tabs) {
      registry.getOrCreate(tab.id, tab.symbol)
    }
  }, [snapshot.tabs, registry])

  useEffect(() => {
    if (popupMode && popupTabId) {
      const tab = snapshot.tabs.find((t) => t.id === popupTabId)
      if (tab) registry.getOrCreate(tab.id, tab.symbol)
    }
  }, [popupMode, popupTabId, snapshot.tabs, registry])

  const broadcast = useCallback(
    (snap: WorkspaceSnapshot) => {
      postWorkspaceUpdated(channelRef.current, snap)
    },
    [],
  )

  const persistWorkspace = useCallback(
    (snap: WorkspaceSnapshot) => {
      saveWorkspace(snap, themeId)
    },
    [themeId],
  )

  const commit = useCallback(
    (updater: (prev: WorkspaceSnapshot) => WorkspaceSnapshot) => {
      setSnapshot((prev) => {
        const next = updater(prev)
        broadcast(next)
        if (workspaceAutoRestore) {
          if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
          autoSaveTimer.current = setTimeout(() => {
            persistWorkspace(next)
          }, 400)
        }
        return next
      })
    },
    [broadcast, workspaceAutoRestore, persistWorkspace],
  )

  useEffect(() => {
    const ch = channelRef.current
    const sch = sessionChannelRef.current
    const onWorkspace = (ev: MessageEvent<WorkspaceMessage>) => {
      if (ev.data?.type === 'workspace:updated') {
        setSnapshot(ev.data.snapshot)
      }
    }
    const onSession = (ev: MessageEvent<SessionMessage>) => {
      if (
        ev.data?.type === 'session:saved' &&
        isForeignSessionMessage(ev.data)
      ) {
        registry.reloadFromStorage(ev.data.tabId)
      }
    }
    ch?.addEventListener('message', onWorkspace)
    sch?.addEventListener('message', onSession)
    return () => {
      ch?.removeEventListener('message', onWorkspace)
      sch?.removeEventListener('message', onSession)
    }
  }, [registry])

  const setWorkspaceSymbol = useCallback(
    (symbol: CoinSymbol) => {
      const label = symbol.replace('USDT', '')
      commit((s) => {
        const tabs = s.tabs.map((t) =>
          symbolSync || t.id === s.activeTabId
            ? { ...t, symbol, label }
            : t,
        )
        for (const tab of tabs) {
          if (symbolSync || tab.id === s.activeTabId) {
            registry.getOrCreate(tab.id, symbol).setSymbol(symbol)
          }
        }
        return { ...s, tabs, savedAt: Date.now() }
      })
    },
    [commit, symbolSync, registry],
  )

  const setSymbolSync = useCallback((v: boolean) => {
    setSymbolSyncState(v)
  }, [])

  const setWorkspaceAutoRestore = useCallback((v: boolean) => {
    setWorkspaceAutoRestoreState(v)
  }, [])

  const setCompactTape = useCallback((v: boolean) => {
    setCompactTapeState(v)
  }, [])

  const setActiveTab = useCallback(
    (tabId: string) => {
      commit((s) => ({ ...s, activeTabId: tabId }))
    },
    [commit],
  )

  const addTab = useCallback(
    (symbol: CoinSymbol) => {
      const label = symbol.replace('USDT', '')
      const tab: WorkspaceTab = { id: newTabId(), symbol, label }
      commit((s) => ({
        ...s,
        tabs: [...s.tabs, tab],
        activeTabId: tab.id,
      }))
    },
    [commit],
  )

  const closeTab = useCallback(
    (tabId: string) => {
      commit((s) => {
        if (s.tabs.length <= 1) return s
        const tabs = s.tabs.filter((t) => t.id !== tabId)
        registry.remove(tabId)
        return {
          ...s,
          tabs,
          activeTabId:
            s.activeTabId === tabId ? tabs[0]!.id : s.activeTabId,
        }
      })
    },
    [commit, registry],
  )

  const setLayoutPreset = useCallback(
    (preset: LayoutPresetId) => {
      commit((s) =>
        themeId === 'theme2'
          ? applyTheme2LayoutPreset(s, preset)
          : applyLayoutPreset(s, preset),
      )
    },
    [commit, themeId],
  )

  const setMonitorPreset = useCallback(
    (preset: MonitorPresetId) => {
      commit((s) => ({ ...s, monitorPreset: preset, savedAt: Date.now() }))
    },
    [commit],
  )

  const save = useCallback(() => {
    setSnapshot((s) => {
      for (const tab of s.tabs) {
        const sess = registry.getOrCreate(tab.id, tab.symbol)
        saveTabSession(exportTabSession(sess, tab.id, tab.symbol))
      }
      const saved = saveWorkspace(s, themeId)
      broadcast(saved)
      return saved
    })
  }, [broadcast, registry, themeId])

  const load = useCallback(() => {
    const loaded = loadWorkspace(themeId)
    for (const tab of loaded.tabs) {
      registry.getOrCreate(tab.id, tab.symbol)
      registry.reloadFromStorage(tab.id)
    }
    setSnapshot(loaded)
    broadcast(loaded)
  }, [broadcast, registry, themeId])

  const patchPanel = useCallback(
    (panelId: PanelId, patch: Partial<PanelState>) => {
      commit((s) => ({
        ...s,
        panels: {
          ...s.panels,
          [panelId]: { ...s.panels[panelId], ...patch },
        },
        savedAt: Date.now(),
      }))
    },
    [commit],
  )

  const detachPanel = useCallback(
    (panelId: PanelId) => {
      const p = snapshot.panels[panelId]
      patchPanel(panelId, {
        detached: true,
        placement: { ...p.placement, zone: 'float' },
      })
    },
    [patchPanel, snapshot.panels],
  )

  const dockPanel = useCallback(
    (panelId: PanelId, zone: DockZone = 'right') => {
      patchPanel(panelId, {
        detached: false,
        popup: false,
        placement: { ...snapshot.panels[panelId].placement, zone },
      })
    },
    [patchPanel, snapshot.panels],
  )

  const movePanel = useCallback(
    (panelId: PanelId, placement: Partial<PanelPlacement>) => {
      const p = snapshot.panels[panelId]
      patchPanel(panelId, {
        placement: { ...p.placement, ...placement },
      })
    },
    [patchPanel, snapshot.panels],
  )

  const openPopup = useCallback(
    (panelId: PanelId, tabId?: string) => {
      const id = tabId ?? activeTab.id
      openWorkspacePopup(id, panelId)
      patchPanel(panelId, { popup: true })
    },
    [activeTab.id, patchPanel],
  )

  const panel = useCallback(
    (id: PanelId) => snapshot.panels[id],
    [snapshot.panels],
  )

  const api = useMemo<WorkspaceApi>(
    () => ({
      snapshot,
      registry,
      activeTab,
      isPopup: popupMode,
      popupPanel: popupPanel ?? null,
      symbolSync,
      workspaceAutoRestore,
      compactTape,
      setActiveTab,
      addTab,
      closeTab,
      setLayoutPreset,
      setMonitorPreset,
      setWorkspaceSymbol,
      setSymbolSync,
      setWorkspaceAutoRestore,
      setCompactTape,
      save,
      load,
      detachPanel,
      dockPanel,
      movePanel,
      openPopup,
      panel,
    }),
    [
      snapshot,
      registry,
      activeTab,
      popupMode,
      popupPanel,
      symbolSync,
      workspaceAutoRestore,
      compactTape,
      setActiveTab,
      addTab,
      closeTab,
      setLayoutPreset,
      setMonitorPreset,
      setWorkspaceSymbol,
      setSymbolSync,
      setWorkspaceAutoRestore,
      setCompactTape,
      save,
      load,
      detachPanel,
      dockPanel,
      movePanel,
      openPopup,
      panel,
    ],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useWorkspace(): WorkspaceApi {
  const w = useContext(Ctx)
  if (!w) throw new Error('useWorkspace outside WorkspaceProvider')
  return w
}

export function useWorkspaceOptional(): WorkspaceApi | null {
  return useContext(Ctx)
}

/** Quick-add tabs for BTC / ETH / SOL when not in multi layout. */
export function ensureCoinTabs(ws: WorkspaceApi): void {
  const have = new Set(ws.snapshot.tabs.map((t) => t.symbol))
  for (const sym of COIN_SYMBOLS) {
    if (!have.has(sym)) ws.addTab(sym)
  }
}
