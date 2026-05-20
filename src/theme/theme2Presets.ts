import type {
  LayoutPresetId,
  PanelId,
  PanelState,
  WorkspaceSnapshot,
  WorkspaceTab,
} from '../workspace/types.ts'

const FLOAT_SPOTS: Record<PanelId, { x: number; y: number; w: number; h: number }> = {
  tape: { x: 12, y: 520, w: 280, h: 100 },
  ladder: { x: 300, y: 40, w: 340, h: 480 },
  order: { x: 660, y: 40, w: 260, h: 220 },
  mit: { x: 660, y: 270, w: 260, h: 140 },
  linkage: { x: 660, y: 420, w: 260, h: 120 },
  dock: { x: 12, y: 640, w: 900, h: 120 },
  status: { x: 12, y: 768, w: 900, h: 28 },
  chart1: { x: 12, y: 40, w: 280, h: 150 },
  chart2: { x: 12, y: 200, w: 280, h: 150 },
  chart3: { x: 12, y: 360, w: 280, h: 150 },
}

function floatPanel(id: PanelId, spot = FLOAT_SPOTS[id]): PanelState {
  return {
    id,
    visible: true,
    detached: true,
    popup: false,
    placement: { zone: 'float', ...spot },
  }
}

export function theme2DefaultPanels(
  layout: LayoutPresetId,
): Record<PanelId, PanelState> {
  const hidden = (id: PanelId): PanelState => ({
    ...floatPanel(id),
    visible: false,
  })

  if (layout === 'theme2-multi-chart') {
    return {
      chart1: floatPanel('chart1'),
      chart2: floatPanel('chart2'),
      chart3: floatPanel('chart3'),
      ladder: floatPanel('ladder', { x: 320, y: 48, w: 320, h: 420 }),
      tape: floatPanel('tape'),
      order: floatPanel('order'),
      mit: floatPanel('mit'),
      linkage: floatPanel('linkage'),
      dock: floatPanel('dock'),
      status: floatPanel('status'),
    }
  }

  return {
    chart1: hidden('chart1'),
    chart2: hidden('chart2'),
    chart3: hidden('chart3'),
    tape: floatPanel('tape'),
    ladder: floatPanel('ladder'),
    order: floatPanel('order'),
    mit: floatPanel('mit'),
    linkage: floatPanel('linkage'),
    dock: floatPanel('dock'),
    status: floatPanel('status'),
  }
}

export function theme2DefaultTabs(): WorkspaceTab[] {
  return [
    { id: 'tab-btc', symbol: 'BTCUSDT', label: 'BTC' },
    { id: 'tab-eth', symbol: 'ETHUSDT', label: 'ETH' },
    { id: 'tab-sol', symbol: 'SOLUSDT', label: 'SOL' },
  ]
}

export function createTheme2Workspace(
  layout: LayoutPresetId = 'theme2-ultra',
): WorkspaceSnapshot {
  const tabs = theme2DefaultTabs()
  return {
    version: 1,
    activeTabId: tabs[0]!.id,
    layoutPreset: layout,
    monitorPreset: 'single',
    tabs,
    panels: theme2DefaultPanels(layout),
    savedAt: Date.now(),
  }
}

export function applyTheme2LayoutPreset(
  snap: WorkspaceSnapshot,
  preset: LayoutPresetId,
): WorkspaceSnapshot {
  const tabs = theme2DefaultTabs()
  return {
    ...snap,
    layoutPreset: preset,
    tabs,
    activeTabId: tabs.some((t) => t.id === snap.activeTabId)
      ? snap.activeTabId
      : tabs[0]!.id,
    panels: theme2DefaultPanels(preset),
    savedAt: Date.now(),
  }
}

export const THEME2_LAYOUT_LABELS: Partial<Record<LayoutPresetId, string>> = {
  'theme2-ultra': '울트라 컴팩트',
  'theme2-multi-chart': '멀티 차트',
}
