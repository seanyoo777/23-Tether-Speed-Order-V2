import type {
  LayoutPresetId,
  MonitorPresetId,
  PanelId,
  PanelState,
  WorkspaceSnapshot,
  WorkspaceTab,
} from './types.ts'

const DEFAULT_FLOAT = { x: 80, y: 60, w: 320, h: 520 }

function panel(
  id: PanelId,
  zone: PanelState['placement']['zone'],
  overrides?: Partial<PanelState>,
): PanelState {
  return {
    id,
    visible: true,
    detached: zone === 'float',
    popup: false,
    placement: { zone, ...DEFAULT_FLOAT },
    ...overrides,
  }
}

export const MONITOR_PRESET_CLASS: Record<MonitorPresetId, string> = {
  single: 'mon-single',
  dual: 'mon-dual',
  triple: 'mon-triple',
}

export function defaultPanels(
  layout: LayoutPresetId,
): Record<PanelId, PanelState> {
  const hidden = (id: PanelId): PanelState => ({
    ...panel(id, 'right'),
    visible: false,
    detached: false,
  })

  const chartsHidden = {
    chart1: hidden('chart1'),
    chart2: hidden('chart2'),
    chart3: hidden('chart3'),
  }

  switch (layout) {
    case 'scalper':
      return {
        ...chartsHidden,
        tape: panel('tape', 'bottom', { placement: { zone: 'bottom', ...DEFAULT_FLOAT, h: 120 } }),
        ladder: panel('ladder', 'center'),
        order: panel('order', 'right'),
        mit: panel('mit', 'right'),
        linkage: panel('linkage', 'right'),
        dock: panel('dock', 'bottom'),
        status: panel('status', 'bottom'),
      }
    case 'wide-ladder':
      return {
        ...chartsHidden,
        tape: hidden('tape'),
        ladder: panel('ladder', 'center'),
        order: hidden('order'),
        mit: hidden('mit'),
        linkage: hidden('linkage'),
        dock: panel('dock', 'bottom'),
        status: panel('status', 'bottom'),
      }
    case 'floating-ladder':
      return {
        ...chartsHidden,
        tape: panel('tape', 'left'),
        ladder: panel('ladder', 'float', {
          detached: true,
          placement: { zone: 'float', x: 120, y: 48, w: 360, h: 560 },
        }),
        order: panel('order', 'right'),
        mit: panel('mit', 'right'),
        linkage: panel('linkage', 'right'),
        dock: panel('dock', 'bottom'),
        status: panel('status', 'bottom'),
      }
    case 'multi-coin':
    case 'default':
    default:
      return {
        ...chartsHidden,
        tape: panel('tape', 'left'),
        ladder: panel('ladder', 'center'),
        order: panel('order', 'right'),
        mit: panel('mit', 'right'),
        linkage: panel('linkage', 'right'),
        dock: panel('dock', 'bottom'),
        status: panel('status', 'bottom'),
      }
  }
}

export function defaultTabs(layout: LayoutPresetId): WorkspaceTab[] {
  if (layout === 'multi-coin') {
    return [
      { id: 'tab-btc', symbol: 'BTCUSDT', label: 'BTC' },
      { id: 'tab-eth', symbol: 'ETHUSDT', label: 'ETH' },
      { id: 'tab-sol', symbol: 'SOLUSDT', label: 'SOL' },
    ]
  }
  return [{ id: 'tab-btc', symbol: 'BTCUSDT', label: 'BTC' }]
}

export function createDefaultWorkspace(
  layout: LayoutPresetId = 'default',
): WorkspaceSnapshot {
  const tabs = defaultTabs(layout)
  return {
    version: 1,
    activeTabId: tabs[0]!.id,
    layoutPreset: layout,
    monitorPreset: 'single',
    tabs,
    panels: defaultPanels(layout),
    savedAt: Date.now(),
  }
}

export function applyLayoutPreset(
  snap: WorkspaceSnapshot,
  preset: LayoutPresetId,
): WorkspaceSnapshot {
  const tabs =
    preset === 'multi-coin'
      ? defaultTabs('multi-coin')
      : snap.tabs.length > 1
        ? snap.tabs
        : defaultTabs(preset)
  const activeTabId = tabs.some((t) => t.id === snap.activeTabId)
    ? snap.activeTabId
    : tabs[0]!.id
  return {
    ...snap,
    layoutPreset: preset,
    tabs,
    activeTabId,
    panels: defaultPanels(preset),
    savedAt: Date.now(),
  }
}

export const LAYOUT_PRESET_LABELS: Partial<Record<LayoutPresetId, string>> = {
  default: '기본',
  scalper: '스캘퍼',
  'multi-coin': 'BTC·ETH·SOL',
  'wide-ladder': '와이드 호가',
  'floating-ladder': '플로팅 호가',
}

export const MONITOR_PRESET_LABELS: Record<MonitorPresetId, string> = {
  single: '1모니터',
  dual: '2모니터',
  triple: '3모니터',
}
