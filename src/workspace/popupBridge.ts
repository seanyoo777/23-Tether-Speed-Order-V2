import type { PanelId, WorkspaceSnapshot } from './types.ts'
import { WORKSPACE_CHANNEL } from './types.ts'

export const SESSION_CHANNEL = 'tether23-session-sync'

const syncSourceId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `src-${Date.now()}`

export type WorkspaceMessage =
  | { type: 'workspace:updated'; snapshot: WorkspaceSnapshot }
  | { type: 'workspace:request' }
  | { type: 'tab:focus'; tabId: string }
  | { type: 'panel:popup-closed'; tabId: string; panel: PanelId }

export type SessionMessage = {
  type: 'session:saved'
  tabId: string
  source: string
}

export function createWorkspaceChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(WORKSPACE_CHANNEL)
}

export function createSessionChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(SESSION_CHANNEL)
}

export function postSessionSaved(
  channel: BroadcastChannel | null,
  tabId: string,
): void {
  channel?.postMessage({
    type: 'session:saved',
    tabId,
    source: syncSourceId,
  } satisfies SessionMessage)
}

export function isForeignSessionMessage(msg: SessionMessage): boolean {
  return msg.source !== syncSourceId
}

export function parsePopupSearch(search: string): {
  popup: boolean
  tabId: string
  panel: PanelId
} {
  const q = new URLSearchParams(search)
  return {
    popup: q.get('popup') === '1',
    tabId: q.get('tabId') ?? 'tab-btc',
    panel: (q.get('panel') as PanelId) ?? 'ladder',
  }
}

export function buildPopupUrl(tabId: string, panel: PanelId = 'ladder'): string {
  const base = typeof location !== 'undefined' ? location.origin + location.pathname : ''
  return `${base}?popup=1&tabId=${encodeURIComponent(tabId)}&panel=${encodeURIComponent(panel)}`
}

export function openWorkspacePopup(
  tabId: string,
  panel: PanelId = 'ladder',
): Window | null {
  if (typeof window === 'undefined') return null
  return window.open(
    buildPopupUrl(tabId, panel),
    `tether23-${tabId}-${panel}`,
    'popup=yes,width=420,height=680,resizable=yes',
  )
}

export function postWorkspaceUpdated(
  channel: BroadcastChannel | null,
  snapshot: WorkspaceSnapshot,
): void {
  channel?.postMessage({
    type: 'workspace:updated',
    snapshot,
  } satisfies WorkspaceMessage)
}
